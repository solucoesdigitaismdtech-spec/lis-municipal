import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusItem } from '@prisma/client';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

/**
 * MapaTrabalhoService
 *
 * Gera o "Mapa de Trabalho" — o PDF que o biomédico usa para
 * ANOTAR À MÃO os resultados dos exames antes da digitação.
 *
 * Diferente do laudo (que é o documento final do paciente),
 * o mapa de trabalho é um documento OPERACIONAL interno:
 *   - Lista os exames coletados
 *   - Para cada exame, mostra os campos esperados (ex: Hemoglobina,
 *     Hematócrito...) com a unidade e a referência
 *   - Deixa um espaço/linha em branco para o biomédico escrever
 *
 * Pode ser gerado:
 *   - Por uma OS específica (mapa de um paciente)
 *   - Por todas as coletas de um dia (mapa em lote)
 */
@Injectable()
export class MapaTrabalhoService {
  private readonly logger = new Logger(MapaTrabalhoService.name);
  private readonly mapasDir = path.join(process.cwd(), 'mapas-trabalho');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.mapasDir)) {
      fs.mkdirSync(this.mapasDir, { recursive: true });
    }
  }

  /**
   * Gera o mapa de trabalho de UMA ordem de serviço.
   */
  async gerarMapaPorOrdem(ordemId: string, laboratorioId: string): Promise<string> {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, laboratorioId },
      include: {
        laboratorio: { select: { nome: true, municipio: true, uf: true } },
        paciente: { select: { nome: true, dataNascimento: true, sexo: true } },
        unidade: { select: { nome: true } },
        itens: {
          include: {
            exame: { include: { valoresRef: { orderBy: { campo: 'asc' } } } },
          },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    const nomeArquivo = `mapa_${ordem.protocolo}.pdf`;
    const caminho = path.join(this.mapasDir, nomeArquivo);

    await this.montarPdf(
      [
        {
          protocolo: ordem.protocolo,
          paciente: ordem.paciente,
          unidade: ordem.unidade,
          itens: ordem.itens,
        },
      ],
      ordem.laboratorio,
      caminho,
      `Mapa de Trabalho — ${ordem.protocolo}`,
    );

    this.logger.log(`Mapa de trabalho gerado: ${ordem.protocolo}`);
    return caminho;
  }

  /**
   * Gera o mapa de trabalho de TODAS as coletas realizadas em um dia.
   * Útil para o biomédico pegar o lote do dia de uma vez.
   */
  async gerarMapaDoDia(laboratorioId: string, data?: string): Promise<string> {
    const dia = data ? new Date(data) : new Date();
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const fim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59);

    // Busca ordens com itens já coletados nesse dia
    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        laboratorioId,
        itens: {
          some: {
            status: { in: [StatusItem.COLETADO, StatusItem.EM_ANALISE] },
            coletadoEm: { gte: inicio, lte: fim },
          },
        },
      },
      include: {
        laboratorio: { select: { nome: true, municipio: true, uf: true } },
        paciente: { select: { nome: true, dataNascimento: true, sexo: true } },
        unidade: { select: { nome: true } },
        itens: {
          where: { status: { in: [StatusItem.COLETADO, StatusItem.EM_ANALISE] } },
          include: {
            exame: { include: { valoresRef: { orderBy: { campo: 'asc' } } } },
          },
        },
      },
      orderBy: { protocolo: 'asc' },
    });

    if (ordens.length === 0) {
      throw new BadRequestException(
        'Nenhuma coleta encontrada para esta data',
      );
    }

    const dataStr = inicio.toISOString().split('T')[0];
    const nomeArquivo = `mapa_dia_${dataStr}.pdf`;
    const caminho = path.join(this.mapasDir, nomeArquivo);

    await this.montarPdf(
      ordens.map((o) => ({
        protocolo: o.protocolo,
        paciente: o.paciente,
        unidade: o.unidade,
        itens: o.itens,
      })),
      ordens[0].laboratorio,
      caminho,
      `Mapa de Trabalho do Dia — ${dataStr}`,
    );

    this.logger.log(`Mapa do dia gerado: ${dataStr} (${ordens.length} pacientes)`);
    return caminho;
  }

  // ─── Montagem do PDF ─────────────────────────────────────────────

  private async montarPdf(
    pacientes: any[],
    laboratorio: any,
    caminho: string,
    titulo: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(caminho);
      doc.pipe(stream);

      const cor = '#0d9488';
      const corTexto = '#1f2937';
      const corLinha = '#d1d5db';

      pacientes.forEach((p, idx) => {
        // Nova página para cada paciente (exceto o primeiro)
        if (idx > 0) doc.addPage();

        // ─── Cabeçalho ───
        doc.fontSize(14).fillColor(cor).text(laboratorio.nome, { align: 'center' });
        doc
          .fontSize(9)
          .fillColor('#6b7280')
          .text(`${laboratorio.municipio}/${laboratorio.uf}`, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(12).fillColor(corTexto).text(titulo, { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(cor).lineWidth(1).stroke();
        doc.moveDown(0.8);

        // ─── Dados do paciente ───
        const idade = this.calcularIdade(p.paciente.dataNascimento);
        doc.fontSize(11).fillColor(corTexto);
        doc.text(`Protocolo: ${p.protocolo}`, { continued: true });
        doc.text(`     Data: ____/____/______`, { align: 'right' });
        doc.fontSize(10);
        doc.text(`Paciente: ${p.paciente.nome}`);
        doc.text(`Sexo: ${p.paciente.sexo}     Idade: ${idade} anos     Unidade: ${p.unidade.nome}`);
        doc.moveDown(0.8);

        // ─── Exames com espaço para anotar ───
        for (const item of p.itens) {
          // Verifica espaço na página; se pouco, nova página
          if (doc.y > 720) doc.addPage();

          doc.fontSize(11).fillColor(cor).text(item.exame.nome);
          doc
            .fontSize(8)
            .fillColor('#6b7280')
            .text(`Material: ${item.exame.material}   Método: ${item.exame.metodo || 'N/A'}`);
          doc.moveDown(0.3);

          // Linhas para cada campo do exame
          doc.fontSize(9).fillColor(corTexto);

          if (item.exame.valoresRef.length > 0) {
            for (const ref of item.exame.valoresRef) {
              const referencia =
                ref.minimo !== null
                  ? `Ref: ${ref.minimo} - ${ref.maximo} ${ref.unidade}`
                  : `Ref: ${ref.textoRef || ''}`;

              const y = doc.y + 2;
              // Nome do campo
              doc.text(`${ref.campo}:`, 50, y, { continued: false, width: 150 });
              // Linha em branco para escrever
              doc
                .moveTo(160, y + 9)
                .lineTo(400, y + 9)
                .strokeColor(corLinha)
                .lineWidth(0.5)
                .stroke();
              // Referência + unidade à direita
              doc
                .fontSize(7)
                .fillColor('#9ca3af')
                .text(referencia, 410, y, { width: 145 });
              doc.fontSize(9).fillColor(corTexto);
              doc.moveDown(0.7);
            }
          } else {
            // Exame sem campos definidos — linha genérica
            const y = doc.y + 2;
            doc.text('Resultado:', 50, y, { width: 150 });
            doc.moveTo(160, y + 9).lineTo(400, y + 9).strokeColor(corLinha).lineWidth(0.5).stroke();
            doc.moveDown(0.7);
          }

          doc.moveDown(0.5);
        }

        // ─── Rodapé de assinatura ───
        if (doc.y > 700) doc.addPage();
        doc.moveDown(1.5);
        const yAss = doc.y;
        doc.moveTo(60, yAss).lineTo(260, yAss).strokeColor('#9ca3af').stroke();
        doc.fontSize(8).fillColor('#6b7280').text('Biomédico responsável (assinatura)', 60, yAss + 4);
      });

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
  }

  private calcularIdade(dataNascimento: Date): number {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }
}

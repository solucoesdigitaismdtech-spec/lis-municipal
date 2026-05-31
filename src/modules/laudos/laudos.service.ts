import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { StatusLaudo, StatusOS } from '@prisma/client';
import * as crypto from 'crypto';
import PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LaudosService
 *
 * Gera o laudo final em PDF com QR Code de autenticação.
 *
 * Fluxo:
 *  1. A ordem precisa estar CONCLUIDA (todos os exames assinados)
 *  2. Gera um hash de autenticação único
 *  3. Monta o PDF com os resultados
 *  4. Gera o QR Code que aponta para a validação pública
 *  5. Salva o PDF e marca o laudo como LIBERADO
 *
 * Nota: nesta versão o PDF é salvo localmente em /laudos.
 * Em produção, seria enviado para S3/R2 (deixaremos preparado).
 */
@Injectable()
export class LaudosService {
  private readonly logger = new Logger(LaudosService.name);
  private readonly laudosDir = path.join(process.cwd(), 'laudos');
  private readonly apiUrl: string;

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private config: ConfigService,
  ) {
    this.apiUrl = this.config.get<string>('API_URL', 'http://localhost:3333');
    // Garante que a pasta de laudos existe
    if (!fs.existsSync(this.laudosDir)) {
      fs.mkdirSync(this.laudosDir, { recursive: true });
    }
  }

  /**
   * Gera o laudo de uma ordem de serviço concluída.
   */
  async gerarLaudo(ordemId: string, laboratorioId: string) {
    // 1. Busca a ordem com todos os dados necessários
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, laboratorioId },
      include: {
        laboratorio: true,
        paciente: true,
        unidade: { select: { nome: true } },
        itens: {
          include: {
            exame: { select: { nome: true, metodo: true, material: true } },
            resultado: true,
          },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // 2. Confirma que está concluída
    if (ordem.status !== StatusOS.CONCLUIDA) {
      throw new BadRequestException(
        'O laudo só pode ser gerado quando todos os exames estiverem liberados',
      );
    }

    // 3. Gera o hash de autenticação único
    const hashAutenticacao = crypto.randomBytes(16).toString('hex');

    // 4. Cria/atualiza o registro do laudo
    const laudo = await this.prisma.laudo.upsert({
      where: { ordemId },
      create: {
        ordemId,
        hashAutenticacao,
        status: StatusLaudo.GERANDO,
      },
      update: {
        hashAutenticacao,
        status: StatusLaudo.GERANDO,
      },
    });

    // 5. Gera o QR Code (aponta para a validação pública)
    const urlValidacao = `${this.apiUrl}/api/laudos/validar/${hashAutenticacao}`;
    const qrCodeDataUrl = await QRCode.toDataURL(urlValidacao, {
      width: 120,
      margin: 1,
    });

    // 6. Monta o PDF
    const nomeArquivo = `laudo_${ordem.protocolo}.pdf`;
    const caminhoPdf = path.join(this.laudosDir, nomeArquivo);
    await this.montarPdf(ordem, hashAutenticacao, qrCodeDataUrl, caminhoPdf);

    // 7. Atualiza o laudo como LIBERADO
    const laudoFinal = await this.prisma.laudo.update({
      where: { id: laudo.id },
      data: {
        status: StatusLaudo.LIBERADO,
        urlPdf: `/laudos/${nomeArquivo}`,
        liberadoEm: new Date(),
      },
    });

    this.logger.log(`Laudo gerado: ${ordem.protocolo}`);

    return {
      id: laudoFinal.id,
      protocolo: ordem.protocolo,
      hashAutenticacao,
      urlPdf: laudoFinal.urlPdf,
      urlValidacao,
      status: laudoFinal.status,
    };
  }

  /**
   * Valida um laudo pelo hash (acesso público — para o QR Code).
   * Não exige login. Retorna apenas dados de confirmação.
   */
  async validarPublico(hash: string) {
    const laudo = await this.prisma.laudo.findFirst({
      where: { hashAutenticacao: hash },
      include: {
        ordem: {
          select: {
            protocolo: true,
            createdAt: true,
            paciente: { select: { nome: true } },
            laboratorio: { select: { nome: true, municipio: true } },
          },
        },
      },
    });

    if (!laudo) {
      return { valido: false, mensagem: 'Laudo não encontrado ou inválido' };
    }

    // Retorna confirmação sem expor dados sensíveis completos
    return {
      valido: true,
      protocolo: laudo.ordem.protocolo,
      paciente: this.mascaraNome(laudo.ordem.paciente.nome),
      laboratorio: laudo.ordem.laboratorio.nome,
      municipio: laudo.ordem.laboratorio.municipio,
      emitidoEm: laudo.liberadoEm,
      mensagem: 'Laudo autêntico e válido',
    };
  }

  /**
   * Retorna o caminho do PDF para download (exige autenticação no controller).
   */
  async obterCaminhoPdf(ordemId: string, laboratorioId: string): Promise<string> {
    const laudo = await this.prisma.laudo.findFirst({
      where: { ordemId, ordem: { laboratorioId } },
      include: { ordem: { select: { protocolo: true } } },
    });

    if (!laudo || !laudo.urlPdf) {
      throw new NotFoundException('Laudo não encontrado');
    }

    const nomeArquivo = `laudo_${laudo.ordem.protocolo}.pdf`;
    const caminho = path.join(this.laudosDir, nomeArquivo);

    if (!fs.existsSync(caminho)) {
      throw new NotFoundException('Arquivo do laudo não encontrado');
    }

    return caminho;
  }

  // ─── Métodos privados ────────────────────────────────────────────

  /**
   * Monta o PDF do laudo usando pdfkit.
   */
  private async montarPdf(
    ordem: any,
    hash: string,
    qrCodeDataUrl: string,
    caminhoPdf: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(caminhoPdf);
      doc.pipe(stream);

      const cor = '#0d9488';
      const corTexto = '#1f2937';

      // ─── Cabeçalho ───
      doc.fontSize(18).fillColor(cor).text(ordem.laboratorio.nome, { align: 'center' });
      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text(
          `${ordem.laboratorio.municipio}/${ordem.laboratorio.uf} — CNES: ${ordem.laboratorio.cnes}`,
          { align: 'center' },
        );
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(cor).stroke();
      doc.moveDown(1);

      // ─── Título ───
      doc.fontSize(14).fillColor(corTexto).text('LAUDO LABORATORIAL', { align: 'center' });
      doc.moveDown(1);

      // ─── Dados do paciente e ordem ───
      doc.fontSize(10).fillColor(corTexto);
      const dataEmissao = new Date().toLocaleDateString('pt-BR');
      doc.text(`Paciente: ${ordem.paciente.nome}`);
      doc.text(`Protocolo: ${ordem.protocolo}`);
      doc.text(`Unidade: ${ordem.unidade.nome}`);
      doc.text(`Data de emissão: ${dataEmissao}`);
      doc.moveDown(1);

      // ─── Resultados de cada exame ───
      for (const item of ordem.itens) {
        if (!item.resultado) continue;

        doc.moveDown(0.5);
        doc.fontSize(12).fillColor(cor).text(item.exame.nome, { underline: false });
        doc
          .fontSize(8)
          .fillColor('#6b7280')
          .text(`Método: ${item.exame.metodo || 'N/A'} — Material: ${item.exame.material}`);
        doc.moveDown(0.3);

        // Tabela de valores
        const valores = item.resultado.valores as Record<string, any>;
        doc.fontSize(9).fillColor(corTexto);

        for (const [campo, info] of Object.entries(valores)) {
          const dados = info as any;
          const valor = dados.valor ?? dados;
          const ref = dados.referencia ? `  (Ref: ${dados.referencia})` : '';
          const situacao =
            dados.situacao && dados.situacao !== 'NORMAL'
              ? `  [${dados.situacao}]`
              : '';

          const linha = `   ${campo}: ${valor} ${dados.unidade || ''}${ref}${situacao}`;
          // Destaca em vermelho se fora da faixa
          if (dados.situacao && dados.situacao !== 'NORMAL') {
            doc.fillColor('#dc2626').text(linha);
            doc.fillColor(corTexto);
          } else {
            doc.text(linha);
          }
        }

        if (item.resultado.parecerTecnico) {
          doc.moveDown(0.3);
          doc.fontSize(8).fillColor('#6b7280').text(`Parecer: ${item.resultado.parecerTecnico}`);
        }
        doc.moveDown(0.5);
      }

      // ─── Rodapé com QR Code ───
      doc.moveDown(2);
      const yRodape = doc.y;
      // Adiciona o QR Code (converte data URL para buffer)
      const qrBuffer = Buffer.from(
        qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
        'base64',
      );
      doc.image(qrBuffer, 50, yRodape, { width: 80 });
      doc
        .fontSize(8)
        .fillColor('#6b7280')
        .text('Escaneie o QR Code para validar a autenticidade deste laudo.', 140, yRodape + 10, {
          width: 300,
        });
      doc.text(`Código de autenticação: ${hash}`, 140, yRodape + 30, { width: 300 });

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
  }

  /**
   * Mascara o nome para exibição pública (privacidade).
   * "Maria da Silva Santos" → "Maria d* S* S*"
   */
  private mascaraNome(nome: string): string {
    const partes = nome.split(' ');
    return partes
      .map((p, i) => (i === 0 ? p : p.charAt(0) + '*'))
      .join(' ');
  }
}

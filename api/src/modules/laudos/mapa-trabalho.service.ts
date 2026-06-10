import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusItem } from '@prisma/client';
import { montarMapaHtml } from './mapa-trabalho-html.template';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MapaTrabalhoService
 *
 * Gera o "Mapa de Trabalho" — PDF que o biomédico usa para ANOTAR À MÃO
 * os resultados antes da digitação.
 *
 * Versão com Puppeteer: monta um HTML estilizado e converte em PDF
 * (mesma técnica do laudo), para um visual mais bonito e fácil de manter.
 * Cada paciente sai em uma página separada.
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

    const html = montarMapaHtml({
      pacientes: [
        { protocolo: ordem.protocolo, paciente: ordem.paciente, unidade: ordem.unidade, itens: ordem.itens },
      ],
      laboratorio: ordem.laboratorio,
      titulo: `Mapa de Trabalho — ${ordem.protocolo}`,
    });

    const caminho = path.join(this.mapasDir, `mapa_${ordem.protocolo}.pdf`);
    await this.htmlParaPdf(html, caminho);

    this.logger.log(`Mapa de trabalho gerado: ${ordem.protocolo}`);
    return caminho;
  }

  /**
   * Gera o mapa de trabalho de TODAS as coletas de um dia.
   */
  async gerarMapaDoDia(laboratorioId: string, data?: string): Promise<string> {
    const dia = data ? new Date(data) : new Date();
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const fim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59);

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
      throw new BadRequestException('Nenhuma coleta encontrada para esta data');
    }

    const dataStr = inicio.toISOString().split('T')[0];

    const html = montarMapaHtml({
      pacientes: ordens.map((o) => ({
        protocolo: o.protocolo, paciente: o.paciente, unidade: o.unidade, itens: o.itens,
      })),
      laboratorio: ordens[0].laboratorio,
      titulo: `Mapa de Trabalho do Dia — ${dataStr}`,
    });

    const caminho = path.join(this.mapasDir, `mapa_dia_${dataStr}.pdf`);
    await this.htmlParaPdf(html, caminho);

    this.logger.log(`Mapa do dia gerado: ${dataStr} (${ordens.length} pacientes)`);
    return caminho;
  }

  /**
   * Gera o mapa de trabalho de uma LISTA de ordens selecionadas.
   * Um único PDF, cada paciente em uma página.
   */
  async gerarMapaLote(ordemIds: string[], laboratorioId: string): Promise<string> {
    if (!ordemIds || ordemIds.length === 0) {
      throw new BadRequestException('Nenhuma ordem selecionada');
    }

    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        id: { in: ordemIds },
        laboratorioId, // garante que só pega OS do laboratório do usuário
      },
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
      orderBy: { protocolo: 'asc' },
    });

    if (ordens.length === 0) {
      throw new NotFoundException('Nenhuma das ordens selecionadas foi encontrada');
    }

    const html = montarMapaHtml({
      pacientes: ordens.map((o) => ({
        protocolo: o.protocolo, paciente: o.paciente, unidade: o.unidade, itens: o.itens,
      })),
      laboratorio: ordens[0].laboratorio,
      titulo: 'Mapa de Trabalho — Lote',
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const caminho = path.join(this.mapasDir, `mapa_lote_${stamp}_${ordens.length}.pdf`);
    await this.htmlParaPdf(html, caminho);

    this.logger.log(`Mapa em lote gerado: ${ordens.length} pacientes`);
    return caminho;
  }

  // ─── Geração do PDF via Puppeteer ────────────────────────────────

  /**
   * Converte o HTML em PDF e salva no caminho indicado.
   * Reaproveita o Puppeteer já usado na geração de laudos.
   */
  private async htmlParaPdf(html: string, caminho: string): Promise<void> {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({
        path: caminho,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      await page.close();
    } finally {
      await browser.close();
    }
  }
}

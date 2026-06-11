import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { montarRelatorioHtml } from './relatorio-html.template';

/**
 * RelatoriosService
 *
 * Gera estatísticas agregadas do laboratório (multi-tenant: sempre
 * filtra pelo laboratorioId do usuário logado).
 *
 * Relatórios:
 *  - produção por período (OS e exames por dia)
 *  - exames mais solicitados (ranking)
 *  - produtividade por profissional (resultados validados/assinados)
 *  - resumo geral (cards)
 */
@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normaliza o intervalo de datas. Se não vier, usa os últimos 30 dias.
   */
  private intervalo(inicio?: string, fim?: string) {
    const hoje = new Date();
    const dtFim = fim ? new Date(fim + 'T23:59:59') : new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
    const dtInicio = inicio
      ? new Date(inicio + 'T00:00:00')
      : new Date(dtFim.getTime() - 29 * 24 * 60 * 60 * 1000); // 30 dias
    return { dtInicio, dtFim };
  }

  /**
   * Resumo geral do período — números para cards.
   */
  async resumo(laboratorioId: string, inicio?: string, fim?: string) {
    const { dtInicio, dtFim } = this.intervalo(inicio, fim);
    const periodo = { gte: dtInicio, lte: dtFim };

    const [totalOS, totalExames, osConcluidas, laudosEmitidos] = await Promise.all([
      this.prisma.ordemServico.count({
        where: { laboratorioId, createdAt: periodo },
      }),
      this.prisma.itemOrdem.count({
        where: { ordem: { laboratorioId, createdAt: periodo } },
      }),
      this.prisma.ordemServico.count({
        where: { laboratorioId, createdAt: periodo, status: 'CONCLUIDA' },
      }),
      this.prisma.laudo.count({
        where: { ordem: { laboratorioId, createdAt: periodo }, status: 'LIBERADO' },
      }),
    ]);

    return {
      periodo: { inicio: dtInicio.toISOString().split('T')[0], fim: dtFim.toISOString().split('T')[0] },
      totalOS,
      totalExames,
      osConcluidas,
      laudosEmitidos,
    };
  }

  /**
   * Produção por dia — quantas OS foram criadas em cada dia do período.
   */
  async producaoPorDia(laboratorioId: string, inicio?: string, fim?: string) {
    const { dtInicio, dtFim } = this.intervalo(inicio, fim);

    const ordens = await this.prisma.ordemServico.findMany({
      where: { laboratorioId, createdAt: { gte: dtInicio, lte: dtFim } },
      select: { createdAt: true, _count: { select: { itens: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupa por dia (AAAA-MM-DD)
    const mapa = new Map<string, { os: number; exames: number }>();
    for (const o of ordens) {
      const dia = o.createdAt.toISOString().split('T')[0];
      const atual = mapa.get(dia) || { os: 0, exames: 0 };
      atual.os += 1;
      atual.exames += o._count.itens;
      mapa.set(dia, atual);
    }

    return Array.from(mapa.entries()).map(([dia, v]) => ({ dia, os: v.os, exames: v.exames }));
  }

  /**
   * Ranking dos exames mais solicitados no período.
   */
  async examesMaisSolicitados(laboratorioId: string, inicio?: string, fim?: string, limite = 10) {
    const { dtInicio, dtFim } = this.intervalo(inicio, fim);

    // Agrupa itens por exame, contando ocorrências
    const grupos = await this.prisma.itemOrdem.groupBy({
      by: ['exameId'],
      where: { ordem: { laboratorioId, createdAt: { gte: dtInicio, lte: dtFim } } },
      _count: { exameId: true },
      orderBy: { _count: { exameId: 'desc' } },
      take: limite,
    });

    // Busca os nomes dos exames
    const ids = grupos.map((g) => g.exameId);
    const exames = await this.prisma.exameCatalogo.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true },
    });
    const nomePorId = new Map(exames.map((e) => [e.id, e.nome]));

    return grupos.map((g) => ({
      exame: nomePorId.get(g.exameId) || 'Desconhecido',
      quantidade: g._count.exameId,
    }));
  }

  /**
   * Produtividade por profissional — resultados validados/assinados no período.
   * Usa o biomedicoId do ResultadoExame (quem trabalhou o resultado).
   */
  async produtividade(laboratorioId: string, inicio?: string, fim?: string) {
    const { dtInicio, dtFim } = this.intervalo(inicio, fim);

    // Resultados cujo item pertence a uma OS do laboratório, validados no período
    const grupos = await this.prisma.resultadoExame.groupBy({
      by: ['biomedicoId'],
      where: {
        validadoEm: { gte: dtInicio, lte: dtFim },
        itemOrdem: { ordem: { laboratorioId } },
      },
      _count: { id: true },
    });

    const ids = grupos.map((g) => g.biomedicoId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, role: true },
    });
    const userPorId = new Map(users.map((u) => [u.id, u]));

    return grupos
      .map((g) => ({
        profissional: userPorId.get(g.biomedicoId)?.name || 'Desconhecido',
        perfil: userPorId.get(g.biomedicoId)?.role || '',
        resultados: g._count.id,
      }))
      .sort((a, b) => b.resultados - a.resultados);
  }
  /**
   * Relatório DETALHADO/ANALÍTICO: lista cada OS do período com o
   * paciente (nome + protocolo, sem CPF) e os exames realizados,
   * cada um com status e data. Agrupado por atendimento.
   */
  async detalhado(laboratorioId: string, inicio?: string, fim?: string) {
    const { dtInicio, dtFim } = this.intervalo(inicio, fim);

    const ordens = await this.prisma.ordemServico.findMany({
      where: { laboratorioId, createdAt: { gte: dtInicio, lte: dtFim } },
      include: {
        paciente: { select: { nome: true } },
        unidade: { select: { nome: true } },
        itens: {
          include: {
            exame: { select: { nome: true } },
            resultado: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return ordens.map((o) => ({
      protocolo: o.protocolo,
      paciente: o.paciente?.nome || '—',
      unidade: o.unidade?.nome || '—',
      data: o.createdAt.toISOString().split('T')[0],
      dataColeta: o.dataColeta ? o.dataColeta.toISOString().split('T')[0] : null,
      exames: o.itens.map((it) => ({
        nome: it.exame?.nome || '—',
        status: this.traduzStatusItem(it.status, it.resultado?.status),
        dataColeta: it.coletadoEm ? it.coletadoEm.toISOString().split('T')[0] : null,
      })),
    }));
  }

  /** Traduz o status do item/resultado para texto legível. */
  private traduzStatusItem(statusItem: string, statusResultado?: string): string {
    if (statusResultado === 'ASSINADO') return 'Liberado';
    if (statusResultado === 'VALIDADO') return 'Validado';
    if (statusResultado === 'DIGITADO') return 'Digitado';
    const mapa: Record<string, string> = {
      AGUARDANDO_COLETA: 'Aguardando coleta',
      COLETADO: 'Coletado',
      EM_ANALISE: 'Em análise',
      RESULTADO_DIGITADO: 'Digitado',
      VALIDADO: 'Validado',
      LIBERADO: 'Liberado',
    };
    return mapa[statusItem] || statusItem;
  }

  /**
   * Gera o PDF de um relatório (geral ou de uma seção específica).
   * @param secoes quais seções incluir
   */
  async gerarPdf(
    laboratorioId: string,
    secoes: ('resumo' | 'producao' | 'exames' | 'produtividade' | 'detalhado')[],
    titulo: string,
    inicio?: string,
    fim?: string,
  ): Promise<Buffer> {
    // Dados do laboratório (cabeçalho formal)
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
      select: { nome: true, cnes: true, municipio: true, uf: true, responsavelTecnico: true, crbm: true },
    });

    // Busca só o que cada seção precisa
    const [resumo, producao, exames, produtividade, detalhado] = await Promise.all([
      secoes.includes('resumo') ? this.resumo(laboratorioId, inicio, fim) : Promise.resolve(undefined),
      secoes.includes('producao') ? this.producaoPorDia(laboratorioId, inicio, fim) : Promise.resolve(undefined),
      secoes.includes('exames') ? this.examesMaisSolicitados(laboratorioId, inicio, fim) : Promise.resolve(undefined),
      secoes.includes('produtividade') ? this.produtividade(laboratorioId, inicio, fim) : Promise.resolve(undefined),
      secoes.includes('detalhado') ? this.detalhado(laboratorioId, inicio, fim) : Promise.resolve(undefined),
    ]);

    const { dtInicio, dtFim } = this.intervalo(inicio, fim);

    const html = montarRelatorioHtml({
      laboratorio,
      periodo: { inicio: dtInicio.toISOString().split('T')[0], fim: dtFim.toISOString().split('T')[0] },
      resumo, producao, exames, produtividade, detalhado,
      secoes, titulo,
    });

    return this.htmlParaPdf(html);
  }

  /**
   * Converte HTML em PDF via Puppeteer.
   */
  private async htmlParaPdf(html: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4', printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      await page.close();
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

import { Controller, Get, Query, Param, Res, UseGuards, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * RelatoriosController
 *
 * Estatísticas do laboratório. Acesso para ADMIN e BIOMEDICO
 * (perfis de gestão). Sempre filtra pelo laboratório do usuário.
 *
 * Parâmetros de período: ?inicio=AAAA-MM-DD&fim=AAAA-MM-DD
 * (se omitidos, usa os últimos 30 dias)
 */
@Controller('relatorios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('resumo')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  resumo(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.relatoriosService.resumo(laboratorioId, inicio, fim);
  }

  @Get('producao')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  producao(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.relatoriosService.producaoPorDia(laboratorioId, inicio, fim);
  }

  @Get('exames-mais-solicitados')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  examesMaisSolicitados(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.relatoriosService.examesMaisSolicitados(laboratorioId, inicio, fim);
  }

  @Get('produtividade')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  produtividade(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.relatoriosService.produtividade(laboratorioId, inicio, fim);
  }

  @Get('detalhado')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  detalhado(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.relatoriosService.detalhado(laboratorioId, inicio, fim);
  }

  /**
   * GET /relatorios/pdf?inicio=&fim=
   * Relatório GERAL (todas as seções) em PDF.
   */
  @Get('pdf')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  async pdfGeral(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    const pdf = await this.relatoriosService.gerarPdf(
      laboratorioId,
      ['resumo', 'producao', 'exames', 'produtividade'],
      'Relatório Geral',
      inicio, fim,
    );
    this.enviarPdf(res, pdf, 'relatorio-geral');
  }

  /**
   * GET /relatorios/pdf/:tipo?inicio=&fim=
   * Relatório individual: producao | exames | produtividade.
   */
  @Get('pdf/:tipo')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  async pdfIndividual(
    @Param('tipo') tipo: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    const titulos: Record<string, string> = {
      producao: 'Produção por Dia',
      exames: 'Exames Mais Solicitados',
      produtividade: 'Produtividade por Profissional',
      detalhado: 'Relatório Detalhado',
    };
    if (!titulos[tipo]) {
      throw new BadRequestException('Tipo de relatório inválido');
    }
    // O detalhado não leva o resumo no topo (é uma listagem própria)
    const secoes = tipo === 'detalhado' ? ['detalhado'] : ['resumo', tipo] as any;
    const pdf = await this.relatoriosService.gerarPdf(laboratorioId, secoes, titulos[tipo], inicio, fim);
    this.enviarPdf(res, pdf, `relatorio-${tipo}`);
  }

  private enviarPdf(res: Response, pdf: Buffer, nome: string) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nome}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

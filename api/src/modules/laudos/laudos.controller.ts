import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { LaudosService } from './laudos.service';
import { LaudoPdfService } from './laudo-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * LaudosController
 *
 * Operações de laudo que exigem login.
 * Gerar laudo: ADMIN e BIOMEDICO. Visualizar/baixar: todos os perfis.
 */
@Controller('laudos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaudosController {
  constructor(
    private readonly laudosService: LaudosService,
    private readonly laudoPdfService: LaudoPdfService,
  ) {}

  @Get()
  listar(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.laudosService.listar(laboratorioId);
  }

  @Get('ordem/:ordemId')
  dados(
    @Param('ordemId') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.laudosService.dadosLaudo(ordemId, laboratorioId);
  }

  @Post('ordem/:ordemId/gerar')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  gerar(
    @Param('ordemId') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.laudosService.gerar(ordemId, laboratorioId);
  }

  /**
   * Gera e devolve o PDF do laudo (Puppeteer).
   * O navegador faz o download direto deste endpoint.
   */
  @Get('ordem/:ordemId/pdf')
  async pdf(
    @Param('ordemId') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
  ) {
    // Pega os dados completos da OS (mesmo método usado na visualização)
    const ordem = await this.laudosService.dadosLaudo(ordemId, laboratorioId);
    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    const pdf = await this.laudoPdfService.gerarPdf(ordem);
    const nomeArquivo = `laudo-${ordem.protocolo || ordemId}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nomeArquivo}"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

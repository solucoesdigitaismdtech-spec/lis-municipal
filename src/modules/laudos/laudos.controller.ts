import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { LaudosService } from './laudos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * LaudosController
 *
 * Geração e validação de laudos.
 *
 * Rota PÚBLICA: /laudos/validar/:hash (sem login — para o QR Code)
 * Rotas protegidas: gerar e baixar o PDF.
 */
@Controller('laudos')
export class LaudosController {
  constructor(private readonly laudosService: LaudosService) {}

  /**
   * GET /laudos/validar/:hash
   * PÚBLICO — usado pelo QR Code para validar autenticidade.
   * Não exige login.
   */
  @Get('validar/:hash')
  validarPublico(@Param('hash') hash: string) {
    return this.laudosService.validarPublico(hash);
  }

  /**
   * POST /laudos/gerar/:ordemId
   * Gera o laudo PDF de uma ordem concluída. BIOMEDICO ou ADMIN.
   */
  @Post('gerar/:ordemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  @HttpCode(HttpStatus.OK)
  gerar(
    @Param('ordemId') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.laudosService.gerarLaudo(ordemId, laboratorioId);
  }

  /**
   * GET /laudos/download/:ordemId
   * Baixa o PDF do laudo. Exige login.
   */
  @Get('download/:ordemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async download(
    @Param('ordemId') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
  ) {
    const caminho = await this.laudosService.obterCaminhoPdf(ordemId, laboratorioId);
    return res.download(caminho);
  }
}

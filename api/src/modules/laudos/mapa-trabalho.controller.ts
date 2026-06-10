import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { MapaTrabalhoService } from './mapa-trabalho.service';
import { GerarMapaLoteDto } from './dto/gerar-mapa-lote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * MapaTrabalhoController
 *
 * Gera o PDF do mapa de trabalho para impressão.
 * Usado por BIOMEDICO, TECNICO e ADMIN.
 */
@Controller('mapa-trabalho')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MapaTrabalhoController {
  constructor(private readonly mapaService: MapaTrabalhoService) {}

  /**
   * GET /mapa-trabalho/ordem/:ordemId
   * Gera e baixa o mapa de trabalho de uma OS específica.
   */
  @Get('ordem/:ordemId')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO, UserRole.TECNICO)
  async porOrdem(
    @Param('ordemId') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
  ) {
    const caminho = await this.mapaService.gerarMapaPorOrdem(ordemId, laboratorioId);
    return res.download(caminho);
  }

  /**
   * POST /mapa-trabalho/lote
   * Gera e baixa UM PDF com o mapa de várias OS selecionadas.
   * Recebe { ordemIds: string[] } no corpo.
   */
  @Post('lote')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO, UserRole.TECNICO)
  async lote(
    @Body() dto: GerarMapaLoteDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
  ) {
    const caminho = await this.mapaService.gerarMapaLote(dto.ordemIds, laboratorioId);
    return res.download(caminho);
  }

  /**
   * GET /mapa-trabalho/dia?data=2026-05-31
   * Gera e baixa o mapa de trabalho de todas as coletas de um dia.
   */
  @Get('dia')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO, UserRole.TECNICO)
  async doDia(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
    @Query('data') data?: string,
  ) {
    const caminho = await this.mapaService.gerarMapaDoDia(laboratorioId, data);
    return res.download(caminho);
  }
}

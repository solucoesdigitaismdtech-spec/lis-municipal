import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdensService } from './ordens.service';
import { CreateOrdemDto } from './dto/create-ordem.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * OrdensController — SESSÃO 1
 *
 * Criar OS / registrar coleta: ADMIN e TECNICO (recepção/coleta).
 * Listagem e agenda: todos os perfis logados.
 */
@Controller('ordens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdensController {
  constructor(private readonly ordensService: OrdensService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateOrdemDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @CurrentUser('sub') solicitanteId: string,
  ) {
    return this.ordensService.create(dto, laboratorioId, solicitanteId);
  }

  @Get()
  findAll(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('status') status?: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
  ) {
    return this.ordensService.findAll(laboratorioId, {
      status,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : 20,
    });
  }

  /**
   * GET /ordens/agenda?data=2026-05-29
   * Lista os pacientes agendados para coletar no dia.
   */
  @Get('agenda')
  agendaDoDia(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('data') data?: string,
  ) {
    return this.ordensService.agendaDoDia(laboratorioId, data);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.ordensService.findOne(id, laboratorioId);
  }

  @Patch(':id/itens/:itemId/coletar')
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  registrarColeta(
    @Param('id') ordemId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.ordensService.registrarColeta(ordemId, itemId, laboratorioId);
  }

  /**
   * PATCH /ordens/:id/coletar-tudo
   * Registra a coleta de todos os exames de uma vez.
   */
  @Patch(':id/coletar-tudo')
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  registrarColetaCompleta(
    @Param('id') ordemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.ordensService.registrarColetaCompleta(ordemId, laboratorioId);
  }

  @Patch(':id/cancelar')
  @Roles(UserRole.ADMIN)
  cancelar(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.ordensService.cancelar(id, laboratorioId);
  }
}

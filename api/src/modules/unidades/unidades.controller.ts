import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UnidadesService } from './unidades.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * UnidadesController
 *
 * Todas as rotas exigem login e operam sempre dentro do
 * laboratório do usuário logado (multi-tenant seguro).
 */
@Controller('unidades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  /**
   * POST /unidades
   * Cria unidade no laboratório do usuário. ADMIN.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateUnidadeDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.unidadesService.create(dto, laboratorioId);
  }

  /**
   * GET /unidades
   * Lista unidades do laboratório. Todos os perfis logados.
   * (Técnico precisa ver as unidades para cadastrar pacientes.)
   */
  @Get()
  findAll(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.unidadesService.findAll(laboratorioId);
  }

  /**
   * GET /unidades/:id
   * Busca uma unidade do laboratório.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.unidadesService.findOne(id, laboratorioId);
  }

  /**
   * PATCH /unidades/:id
   * Atualiza unidade. ADMIN.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUnidadeDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.unidadesService.update(id, dto, laboratorioId);
  }

  /**
   * PATCH /unidades/:id/toggle-active
   * Ativa/desativa unidade. ADMIN.
   */
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  toggleActive(
    @Param('id') id: string,
    @Body('ativa') ativa: boolean,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.unidadesService.toggleActive(id, ativa, laboratorioId);
  }
}

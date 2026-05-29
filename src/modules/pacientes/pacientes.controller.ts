import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * PacientesController
 *
 * Todas as rotas exigem login e operam dentro do laboratório
 * do usuário logado (isolamento multi-tenant).
 *
 * Permissões:
 *   - Criar/editar: ADMIN e TECNICO (quem faz o atendimento)
 *   - Listar/ver: todos os perfis (biomédico precisa ver dados do paciente)
 *   - Desativar: apenas ADMIN
 */
@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * POST /pacientes
   * Cadastra um novo paciente. ADMIN ou TECNICO.
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePacienteDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.pacientesService.create(dto, laboratorioId);
  }

  /**
   * GET /pacientes?busca=joão&pagina=1&limite=20
   * Lista pacientes com busca por nome e paginação.
   */
  @Get()
  findAll(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('busca') busca?: string,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
  ) {
    return this.pacientesService.findAll(laboratorioId, {
      busca,
      pagina: pagina ? parseInt(pagina) : 1,
      limite: limite ? parseInt(limite) : 20,
    });
  }

  /**
   * GET /pacientes/buscar-cpf/:cpf
   * Busca um paciente pelo CPF (usando hash, sem expor o dado).
   */
  @Get('buscar-cpf/:cpf')
  findByCpf(
    @Param('cpf') cpf: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.pacientesService.findByCpf(cpf, laboratorioId);
  }

  /**
   * GET /pacientes/:id
   * Busca um paciente específico com todos os dados.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.pacientesService.findOne(id, laboratorioId);
  }

  /**
   * PATCH /pacientes/:id
   * Atualiza dados de um paciente. ADMIN ou TECNICO.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePacienteDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.pacientesService.update(id, dto, laboratorioId);
  }

  /**
   * DELETE /pacientes/:id
   * Desativa um paciente (soft delete). Apenas ADMIN.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.pacientesService.remove(id, laboratorioId);
  }
}

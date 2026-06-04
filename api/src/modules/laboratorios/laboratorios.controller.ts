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
import { LaboratoriosService } from './laboratorios.service';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * LaboratoriosController
 *
 * Todas as rotas exigem login.
 * Criação de laboratório é restrita a ADMIN.
 *
 * IMPORTANTE: num cenário multi-município real, a criação de
 * laboratórios seria feita por um "super admin" da plataforma.
 * Por enquanto, deixamos ADMIN poder criar para facilitar os testes.
 */
@Controller('laboratorios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaboratoriosController {
  constructor(private readonly laboratoriosService: LaboratoriosService) {}

  /**
   * POST /laboratorios
   * Cria um novo laboratório. Apenas ADMIN.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLaboratorioDto) {
    return this.laboratoriosService.create(dto);
  }

  /**
   * GET /laboratorios
   * Lista todos os laboratórios. Apenas ADMIN.
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.laboratoriosService.findAll();
  }

  /**
   * GET /laboratorios/meu
   * Retorna o laboratório do usuário logado.
   * Qualquer perfil pode ver o próprio laboratório.
   */
  @Get('meu')
  findMeu(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.laboratoriosService.findOne(laboratorioId);
  }

  /**
   * GET /laboratorios/:id
   * Busca um laboratório específico. Apenas ADMIN.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.laboratoriosService.findOne(id);
  }

  /**
   * PATCH /laboratorios/:id
   * Atualiza um laboratório. Apenas ADMIN.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateLaboratorioDto) {
    return this.laboratoriosService.update(id, dto);
  }

  /**
   * PATCH /laboratorios/:id/toggle-active
   * Ativa/desativa um laboratório. Apenas ADMIN.
   */
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string, @Body('ativo') ativo: boolean) {
    return this.laboratoriosService.toggleActive(id, ativo);
  }
}

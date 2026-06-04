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
import { ExamesService } from './exames.service';
import { CreateExameDto } from './dto/create-exame.dto';
import { UpdateExameDto } from './dto/update-exame.dto';
import { CreateValorReferenciaDto } from './dto/create-valor-referencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * ExamesController
 *
 * Catálogo de exames. Configuração (criar/editar) é de ADMIN
 * e BIOMEDICO (que entende a parte técnica). Listagem é livre
 * para todos os perfis logados.
 */
@Controller('exames')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamesController {
  constructor(private readonly examesService: ExamesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateExameDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.examesService.create(dto, laboratorioId);
  }

  @Get()
  findAll(
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Query('categoria') categoria?: string,
    @Query('busca') busca?: string,
  ) {
    return this.examesService.findAll(laboratorioId, { categoria, busca });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.examesService.findOne(id, laboratorioId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExameDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.examesService.update(id, dto, laboratorioId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.examesService.remove(id, laboratorioId);
  }

  // ─── Valores de referência ──────────────────────────────────────

  @Post(':id/valores-referencia')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  @HttpCode(HttpStatus.CREATED)
  addValorReferencia(
    @Param('id') exameId: string,
    @Body() dto: CreateValorReferenciaDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.examesService.addValorReferencia(exameId, dto, laboratorioId);
  }

  @Delete(':id/valores-referencia/:valorId')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  removeValorReferencia(
    @Param('id') exameId: string,
    @Param('valorId') valorId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.examesService.removeValorReferencia(exameId, valorId, laboratorioId);
  }
}

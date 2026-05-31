import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ResultadosService } from './resultados.service';
import { DigitarResultadoDto } from './dto/digitar-resultado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * ResultadosController — SESSÃO 1 (papéis separados)
 *
 * FLUXO REAL DO LABORATÓRIO:
 *   - TECNICO DIGITA os resultados (a partir do mapa de trabalho)
 *   - BIOMEDICO VALIDA e ASSINA (confere e libera)
 *
 * O ADMIN pode tudo (supervisão).
 */
@Controller('resultados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultadosController {
  constructor(private readonly resultadosService: ResultadosService) {}

  /**
   * GET /resultados/pendentes
   * Fila de exames aguardando digitação. TECNICO e ADMIN.
   */
  @Get('pendentes')
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  listarPendentes(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.resultadosService.listarPendentes(laboratorioId);
  }

  /**
   * GET /resultados/aguardando-validacao
   * Fila do BIOMEDICO: resultados digitados aguardando validação.
   */
  @Get('aguardando-validacao')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  listarAguardandoValidacao(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.resultadosService.listarAguardandoValidacao(laboratorioId);
  }

  /**
   * POST /resultados/:itemOrdemId/digitar
   * TECNICO digita o resultado (a partir do mapa de trabalho preenchido).
   */
  @Post(':itemOrdemId/digitar')
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  @HttpCode(HttpStatus.OK)
  digitar(
    @Param('itemOrdemId') itemOrdemId: string,
    @Body() dto: DigitarResultadoDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @CurrentUser('sub') usuarioId: string,
  ) {
    return this.resultadosService.digitar(itemOrdemId, dto, laboratorioId, usuarioId);
  }

  /**
   * PATCH /resultados/:itemOrdemId/validar
   * BIOMEDICO valida o resultado digitado.
   */
  @Patch(':itemOrdemId/validar')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  validar(
    @Param('itemOrdemId') itemOrdemId: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.resultadosService.validar(itemOrdemId, laboratorioId);
  }

  /**
   * PATCH /resultados/:itemOrdemId/assinar
   * BIOMEDICO assina (libera). Assinatura digital do responsável.
   */
  @Patch(':itemOrdemId/assinar')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  assinar(
    @Param('itemOrdemId') itemOrdemId: string,
    @Body('parecerTecnico') parecerTecnico: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.resultadosService.assinar(itemOrdemId, laboratorioId, parecerTecnico);
  }
}

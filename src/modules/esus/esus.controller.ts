import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { EsusService } from './esus.service';
import { ConfigurarConexaoDto } from './dto/configurar-conexao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * EsusController
 *
 * Endpoints da integração e-SUS.
 *
 * Configuração da conexão: apenas ADMIN.
 * Busca de pacientes: ADMIN e TECNICO (quem faz atendimento).
 */
@Controller('esus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EsusController {
  constructor(private readonly esusService: EsusService) {}

  /**
   * POST /esus/conexao
   * Configura a conexão e-SUS do laboratório. Apenas ADMIN.
   * Testa a conexão automaticamente ao salvar.
   */
  @Post('conexao')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  configurarConexao(
    @Body() dto: ConfigurarConexaoDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.esusService.configurarConexao(dto, laboratorioId, userId);
  }

  /**
   * GET /esus/conexao/status
   * Mostra o status da conexão (sem expor credenciais). ADMIN.
   */
  @Get('conexao/status')
  @Roles(UserRole.ADMIN)
  obterStatus(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.esusService.obterStatusConexao(laboratorioId);
  }

  /**
   * POST /esus/conexao/testar
   * Testa novamente a conexão já cadastrada. ADMIN.
   */
  @Post('conexao/testar')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  testarConexao(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.esusService.testarConexaoExistente(laboratorioId);
  }

  /**
   * GET /esus/buscar/:cpf
   * Busca um paciente no e-SUS pelo CPF. ADMIN ou TECNICO.
   * Aplica rate limiting e registra auditoria.
   */
  @Get('buscar/:cpf')
  @Roles(UserRole.ADMIN, UserRole.TECNICO)
  buscarPaciente(
    @Param('cpf') cpf: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    const userAgent = req.headers['user-agent'];

    return this.esusService.buscarPaciente(
      cpf,
      laboratorioId,
      userId,
      ip,
      userAgent,
    );
  }
}

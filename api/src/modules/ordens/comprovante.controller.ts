import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { ComprovanteService } from './comprovante.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * ComprovanteController
 *
 * Gera o PDF do comprovante de atendimento (com QR) de uma OS.
 * Acesso por quem opera o laboratório.
 */
@Controller('ordens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComprovanteController {
  constructor(private readonly comprovanteService: ComprovanteService) {}

  /**
   * GET /ordens/:id/comprovante
   * Gera e exibe o PDF do comprovante de atendimento.
   */
  @Get(':id/comprovante')
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO, UserRole.TECNICO)
  async comprovante(
    @Param('id') id: string,
    @CurrentUser('laboratorioId') laboratorioId: string,
    @Res() res: Response,
  ) {
    const { pdf, protocolo } = await this.comprovanteService.gerarComprovantePdf(id, laboratorioId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprovante-${protocolo}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { LaudosService } from './laudos.service';
import { LaudoPdfService } from './laudo-pdf.service';

/**
 * LaudosPublicoController
 *
 * Rotas PÚBLICAS (sem login) relacionadas a laudos:
 *  - verificar a autenticidade pelo hash do QR code (dados mínimos)
 *  - baixar o PDF do laudo pelo hash (usado pelo Portal do Paciente)
 *
 * Importante: este controller NÃO usa JwtAuthGuard, por isso é separado
 * do controller principal. A segurança vem do hash (aleatório e único).
 */
@Controller('publico/laudos')
export class LaudosPublicoController {
  constructor(
    private readonly laudosService: LaudosService,
    private readonly laudoPdfService: LaudoPdfService,
  ) {}

  @Get('verificar/:hash')
  verificar(@Param('hash') hash: string) {
    return this.laudosService.verificar(hash);
  }

  /**
   * GET /publico/laudos/:hash/pdf
   * Baixa o PDF do laudo pelo hash — acesso público (Portal do Paciente).
   * Só funciona se o laudo existir e estiver liberado.
   */
  @Get(':hash/pdf')
  async pdf(@Param('hash') hash: string, @Res() res: Response) {
    const ordem = await this.laudosService.dadosLaudoPorHash(hash);
    if (!ordem) {
      throw new NotFoundException('Laudo não encontrado');
    }
    const pdf = await this.laudoPdfService.gerarPdf(ordem);
    const nomeArquivo = `laudo-${ordem.protocolo || hash}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nomeArquivo}"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { LaudosService } from './laudos.service';

/**
 * LaudosPublicoController
 *
 * Rota PÚBLICA (sem login) para verificar a autenticidade de um laudo
 * pelo hash do QR code. Retorna apenas dados mínimos e mascarados (LGPD).
 *
 * Importante: este controller NÃO usa JwtAuthGuard, por isso é separado
 * do controller principal. Qualquer pessoa com o hash pode verificar.
 */
@Controller('publico/laudos')
export class LaudosPublicoController {
  constructor(private readonly laudosService: LaudosService) {}

  @Get('verificar/:hash')
  verificar(@Param('hash') hash: string) {
    return this.laudosService.verificar(hash);
  }
}

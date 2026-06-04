import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PortalService } from './portal.service';

/**
 * PortalController
 *
 * Endpoints PÚBLICOS do Portal do Paciente (sem autenticação).
 * O paciente acessa de casa, pelo celular, com protocolo + data nasc.
 *
 * Note que NÃO usa JwtAuthGuard — é proposital, é uma área pública.
 * A segurança vem da combinação protocolo + data de nascimento.
 */
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  /**
   * GET /portal/consultar?protocolo=LAB-...&nascimento=AAAA-MM-DD
   * Consulta o andamento dos exames.
   */
  @Get('consultar')
  @HttpCode(HttpStatus.OK)
  consultar(
    @Query('protocolo') protocolo: string,
    @Query('nascimento') nascimento: string,
  ) {
    return this.portalService.consultar(protocolo, nascimento);
  }
}

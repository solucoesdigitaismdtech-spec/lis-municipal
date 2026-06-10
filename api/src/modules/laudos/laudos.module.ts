import { Module } from '@nestjs/common';
import { LaudosService } from './laudos.service';
import { LaudoPdfService } from './laudo-pdf.service';
import { LaudosController } from './laudos.controller';
import { LaudosPublicoController } from './laudos-publico.controller';
import { MapaTrabalhoController } from './mapa-trabalho.controller';
import { MapaTrabalhoService } from './mapa-trabalho.service';

/**
 * LaudosModule
 * Geração e verificação de laudos (PDF via Puppeteer) +
 * geração do mapa de trabalho (PDF via Puppeteer).
 *
 * O LaudoPdfService é injetado também no LaudosPublicoController,
 * para permitir o download público do PDF pelo hash (Portal do Paciente).
 */
@Module({
  controllers: [
    LaudosController,
    LaudosPublicoController,
    MapaTrabalhoController,
  ],
  providers: [
    LaudosService,
    LaudoPdfService,
    MapaTrabalhoService,
  ],
  exports: [LaudosService],
})
export class LaudosModule {}

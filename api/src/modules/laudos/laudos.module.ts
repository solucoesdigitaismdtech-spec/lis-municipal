import { Module } from '@nestjs/common';
import { LaudosService } from './laudos.service';
import { LaudoPdfService } from './laudo-pdf.service';
import { LaudosController } from './laudos.controller';
import { LaudosPublicoController } from './laudos-publico.controller';

/**
 * LaudosModule
 * Geração e verificação de laudos, incluindo PDF via Puppeteer.
 */
@Module({
  controllers: [LaudosController, LaudosPublicoController],
  providers: [LaudosService, LaudoPdfService],
  exports: [LaudosService],
})
export class LaudosModule {}

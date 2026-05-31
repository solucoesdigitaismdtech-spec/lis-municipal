import { Module } from '@nestjs/common';
import { LaudosService } from './laudos.service';
import { LaudosController } from './laudos.controller';

/**
 * LaudosModule
 * Geração de laudos PDF + QR Code + validação pública.
 */
@Module({
  controllers: [LaudosController],
  providers: [LaudosService],
  exports: [LaudosService],
})
export class LaudosModule {}

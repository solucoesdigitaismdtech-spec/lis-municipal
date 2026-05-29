import { Module } from '@nestjs/common';
import { OrdensService } from './ordens.service';
import { OrdensController } from './ordens.controller';

/**
 * OrdensModule
 * Ordens de Serviço + fluxo de coleta.
 */
@Module({
  controllers: [OrdensController],
  providers: [OrdensService],
  exports: [OrdensService],
})
export class OrdensModule {}

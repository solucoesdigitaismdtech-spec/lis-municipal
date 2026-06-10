import { Module } from '@nestjs/common';
import { ComprovanteController } from './comprovante.controller';
import { ComprovanteService } from './comprovante.service';

/**
 * ComprovanteModule
 * Geração do comprovante de atendimento com QR code (Portal do Paciente).
 */
@Module({
  controllers: [ComprovanteController],
  providers: [ComprovanteService],
})
export class ComprovanteModule {}

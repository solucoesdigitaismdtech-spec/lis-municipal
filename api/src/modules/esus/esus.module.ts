import { Module } from '@nestjs/common';
import { EsusService } from './esus.service';
import { EsusController } from './esus.controller';
import { EsusConnectionService } from './esus-connection.service';

/**
 * EsusModule
 *
 * Integração com o e-SUS PEC dos municípios.
 *
 * Contém dois services:
 *  - EsusConnectionService: lida com a conexão técnica ao Postgres e-SUS
 *  - EsusService: orquestra a lógica de negócio (busca, snapshot, auditoria)
 *
 * O CryptoService e o PrismaService já estão disponíveis globalmente.
 */
@Module({
  controllers: [EsusController],
  providers: [EsusService, EsusConnectionService],
  exports: [EsusService],
})
export class EsusModule {}

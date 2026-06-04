import { Module } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { UnidadesController } from './unidades.controller';

/**
 * UnidadesModule
 *
 * Gerencia as unidades de saúde (UBS, UPA, postos) de cada laboratório.
 * Todo paciente e toda ordem de serviço pertencem a uma unidade.
 */
@Module({
  controllers: [UnidadesController],
  providers: [UnidadesService],
  exports: [UnidadesService],
})
export class UnidadesModule {}

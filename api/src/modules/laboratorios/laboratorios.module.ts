import { Module } from '@nestjs/common';
import { LaboratoriosService } from './laboratorios.service';
import { LaboratoriosController } from './laboratorios.controller';

/**
 * LaboratoriosModule
 *
 * Gerencia os laboratórios municipais (os "tenants" do sistema).
 * Cada laboratório é um município/cliente que usa o LIS.
 *
 * Importante: a criação de laboratórios é uma operação especial.
 * Normalmente só o "super admin" da plataforma (você) cria laboratórios.
 * Os admins de cada laboratório gerenciam apenas o próprio.
 */
@Module({
  controllers: [LaboratoriosController],
  providers: [LaboratoriosService],
  exports: [LaboratoriosService],
})
export class LaboratoriosModule {}

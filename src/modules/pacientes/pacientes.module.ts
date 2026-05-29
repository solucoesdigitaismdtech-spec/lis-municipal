import { Module } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';

/**
 * PacientesModule
 *
 * Gerencia o cadastro de pacientes (Via 1 — cadastro local).
 *
 * Este é o módulo onde a criptografia LGPD entra em ação:
 * todos os dados sensíveis (CPF, nome da mãe, telefone, etc.)
 * são criptografados antes de salvar no banco.
 *
 * O CryptoService já está disponível globalmente (@Global),
 * então não precisamos importá-lo aqui.
 */
@Module({
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}

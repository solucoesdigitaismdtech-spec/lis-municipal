import { Global, Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/**
 * CryptoModule
 *
 * @Global() — disponível em toda a aplicação sem reimportar.
 * O CryptoService será usado por:
 *   - EsusModule (criptografar credenciais)
 *   - PacientesModule (criptografar CPF/dados LGPD)
 *   - UsersModule (criptografar segredo 2FA)
 */
@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}

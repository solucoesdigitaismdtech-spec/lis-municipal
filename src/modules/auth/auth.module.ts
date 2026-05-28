import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';
import type { JwtModuleOptions } from '@nestjs/jwt';

/**
 * AuthModule
 *
 * Centraliza tudo relacionado a autenticação:
 *   - Login com email/senha
 *   - Geração de accessToken (JWT, expira em 15min)
 *   - Geração de refreshToken (expira em 7 dias)
 *   - Renovação de accessToken via refreshToken
 *   - Logout (revoga o refreshToken)
 *
 * Estratégias (Passport):
 *   - JwtStrategy: valida o accessToken em rotas protegidas
 *   - JwtRefreshStrategy: valida o refreshToken na rota /auth/refresh
 */
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Configura o JWT usando os valores do .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
useFactory: (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.getOrThrow<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
  },
}),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}

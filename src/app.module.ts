import { EsusModule } from './modules/esus/esus.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LaboratoriosModule } from './modules/laboratorios/laboratorios.module';
import { UnidadesModule } from './modules/unidades/unidades.module';

/**
 * AppModule
 *
 * Módulo raiz da aplicação. Importa todos os outros módulos.
 * Ordem de imports importa: Config → Prisma → Crypto → Módulos de negócio.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PrismaModule,
    CryptoModule,

    // Autenticação e usuários
    AuthModule,
    UsersModule,

    // ── NOVOS MÓDULOS (Fase 2 — parte 1) ──
    LaboratoriosModule,
    UnidadesModule,

    // Próximos módulos entrarão aqui:
    // PacientesModule,
    PacientesModule,

    // EsusModule,
    EsusModule,

    // ExamesModule,
    // OrdensModule,
    // ResultadosModule,
    // LaudosModule,
    // AuditoriaModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}

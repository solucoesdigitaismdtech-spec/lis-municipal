import { ComprovanteModule } from './modules/ordens/comprovante.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LaboratoriosModule } from './modules/laboratorios/laboratorios.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { EsusModule } from './modules/esus/esus.module';
import { ExamesModule } from './modules/exames/exames.module';
import { OrdensModule } from './modules/ordens/ordens.module';
import { ResultadosModule } from './modules/resultados/resultados.module';
import { LaudosModule } from './modules/laudos/laudos.module';
import { PortalModule } from './modules/portal/portal.module';

/**
 * AppModule
 *
 * Módulo raiz da aplicação. Importa todos os módulos do sistema.
 */
@Module({
  imports: [
    // Configuração (.env) — global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Serve a página do Portal do Paciente (arquivos estáticos)
    // Fica acessível em http://localhost:3333/portal
   ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', '..', 'public'),
  serveRoot: '/portal',
  exclude: ['/api/(.*)'],
}),
    // Infraestrutura
    PrismaModule,
    CryptoModule,

    // Autenticação e usuários
    AuthModule,
    UsersModule,

    // Cadastros base
    LaboratoriosModule,
    UnidadesModule,
    PacientesModule,
    EsusModule,

    // Fluxo clínico
    ExamesModule,
    OrdensModule,
    ResultadosModule,
    LaudosModule,
    ComprovanteModule,

    // Portal público do paciente
    PortalModule,
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

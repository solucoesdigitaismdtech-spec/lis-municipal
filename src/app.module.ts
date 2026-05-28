import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

/**
 * AppModule
 *
 * Módulo raiz da aplicação. Importa todos os outros módulos.
 * Ordem de imports importa: Config → Prisma → Crypto → Módulos de negócio.
 *
 * À medida que criarmos novos módulos (Pacientes, Esus, etc.),
 * eles serão adicionados aqui.
 */
@Module({
  imports: [
    // Carrega o .env e disponibiliza ConfigService em toda a app
    ConfigModule.forRoot({
      isGlobal: true,       // Disponível sem precisar importar em cada módulo
      envFilePath: '.env',  // Caminho do arquivo .env
    }),

    // Banco de dados — @Global(), disponível em toda a app
    PrismaModule,

    // Criptografia AES-256-GCM — @Global()
    CryptoModule,

    // Autenticação JWT
    AuthModule,

    // Usuários do sistema
    UsersModule,

    // Próximos módulos entrarão aqui:
    // LaboratoriosModule,
    // PacientesModule,
    // EsusModule,
    // ExamesModule,
    // OrdensModule,
    // ResultadosModule,
    // LaudosModule,
    // AuditoriaModule,
  ],
  providers: [
    /**
     * ValidationPipe global
     *
     * Aplica validação automática em TODOS os endpoints usando
     * os decorators do class-validator (como @IsEmail, @IsString etc.)
     *
     * whitelist: true → remove campos não declarados nos DTOs
     * forbidNonWhitelisted → retorna erro se enviar campos extras
     * transform: true → converte tipos automaticamente (string → number)
     */
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

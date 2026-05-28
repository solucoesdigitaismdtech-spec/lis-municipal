import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  /**
   * Prefixo global para todas as rotas.
   * Ex: /api/auth/login, /api/users, /api/pacientes
   */
  app.setGlobalPrefix('api');

  /**
   * CORS — permite que o frontend acesse a API.
   * Em produção, substituir 'http://localhost:3000' pela URL real do frontend.
   */
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);

  logger.log(`🚀 LIS Municipal API rodando em: http://localhost:${port}/api`);
  logger.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

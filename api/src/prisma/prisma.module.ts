import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule
 *
 * O decorator @Global() faz com que o PrismaService
 * esteja disponível em TODOS os módulos da aplicação
 * sem precisar importar o PrismaModule em cada um.
 *
 * Basta declarar no AppModule uma vez.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

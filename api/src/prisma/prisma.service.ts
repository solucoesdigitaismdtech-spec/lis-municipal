import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService
 *
 * É a ponte entre o NestJS e o banco de dados PostgreSQL.
 * Estende o PrismaClient original e gerencia o ciclo de vida
 * da conexão: abre quando o servidor sobe, fecha quando desliga.
 *
 * Como usar em qualquer outro serviço:
 *   constructor(private prisma: PrismaService) {}
 *   const users = await this.prisma.user.findMany();
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      // Log de queries apenas em desenvolvimento
      // Em produção isso seria desabilitado por performance
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });
  }

  /**
   * Executado automaticamente quando o NestJS inicializa o módulo.
   * Abre a conexão com o banco.
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Banco de dados conectado com sucesso');
    } catch (error) {
      this.logger.error('❌ Falha ao conectar ao banco de dados', error);
      // Encerra o processo se não conseguir conectar
      // Evita que o servidor suba em estado inválido
      process.exit(1);
    }
  }

  /**
   * Executado automaticamente quando o NestJS desliga.
   * Fecha a conexão com o banco de forma limpa.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Conexão com banco encerrada');
  }

  /**
   * Utilitário para limpar o banco em testes.
   * NUNCA deve ser chamado em produção.
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase não pode ser executado em produção!');
    }
    // Deleta na ordem correta para respeitar as foreign keys
    await this.$transaction([
      this.auditLog.deleteMany(),
      this.notificacao.deleteMany(),
      this.laudo.deleteMany(),
      this.resultadoExame.deleteMany(),
      this.itemOrdem.deleteMany(),
      this.ordemServico.deleteMany(),
      this.pacienteEsusSnapshot.deleteMany(),
      this.esusAccessLog.deleteMany(),
      this.paciente.deleteMany(),
      this.valorReferencia.deleteMany(),
      this.exameCatalogo.deleteMany(),
      this.refreshToken.deleteMany(),
      this.esusConexao.deleteMany(),
      this.user.deleteMany(),
      this.unidadeSaude.deleteMany(),
      this.laboratorio.deleteMany(),
    ]);
  }
}

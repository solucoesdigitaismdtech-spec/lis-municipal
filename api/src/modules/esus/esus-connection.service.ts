import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { CryptoService } from '../../common/crypto/crypto.service';

/**
 * EsusConnectionService
 *
 * Responsável por abrir conexões SEGURAS e TEMPORÁRIAS ao banco
 * PostgreSQL do e-SUS PEC de um município.
 *
 * Princípios de segurança aplicados:
 *
 *  1. CONEXÃO ON-DEMAND: a conexão é aberta só quando precisa,
 *     usada, e fechada IMEDIATAMENTE. Não há pool persistente.
 *     Isso minimiza a janela de ataque e o consumo no servidor e-SUS.
 *
 *  2. TIMEOUT CURTO: máximo de 5 segundos. Se o e-SUS não responder,
 *     a conexão é abortada para não travar o sistema.
 *
 *  3. READ-ONLY NO CÓDIGO: este service só executa SELECT.
 *     (Recomenda-se também criar o usuário e-SUS com permissão
 *      SELECT-only no banco origem — dupla proteção.)
 *
 *  4. CREDENCIAIS DESCRIPTOGRAFADAS EM MEMÓRIA: host, usuário e senha
 *     só existem em texto puro durante a conexão. Nunca são logados.
 */
@Injectable()
export class EsusConnectionService {
  private readonly logger = new Logger(EsusConnectionService.name);
  private readonly timeoutMs: number;

  constructor(
    private crypto: CryptoService,
    private config: ConfigService,
  ) {
    this.timeoutMs = parseInt(
      this.config.get<string>('ESUS_CONNECTION_TIMEOUT_MS', '5000'),
    );
  }

  /**
   * Abre uma conexão temporária ao e-SUS, executa uma função
   * e fecha a conexão automaticamente (mesmo se der erro).
   *
   * É o padrão "with connection" — garante que a conexão SEMPRE
   * será fechada, evitando vazamento de conexões.
   *
   * @param credentials — credenciais JÁ criptografadas (do banco)
   * @param fn — função que recebe o client conectado e faz a query
   */
  async withConnection<T>(
    credentials: {
      hostEncrypted: string;
      usuarioEncrypted: string;
      senhaEncrypted: string;
      porta: number;
      banco: string;
    },
    fn: (client: Client) => Promise<T>,
  ): Promise<T> {
    // Descriptografa as credenciais SÓ no momento do uso
    const host = this.crypto.decrypt(credentials.hostEncrypted);
    const user = this.crypto.decrypt(credentials.usuarioEncrypted);
    const password = this.crypto.decrypt(credentials.senhaEncrypted);

    const client = new Client({
      host,
      port: credentials.porta,
      database: credentials.banco,
      user,
      password,
      // Timeout de conexão
      connectionTimeoutMillis: this.timeoutMs,
      // Timeout de query
      query_timeout: this.timeoutMs,
      statement_timeout: this.timeoutMs,
      // SSL pode ser necessário dependendo do município — ajustável
      ssl: false,
    });

    try {
      await client.connect();
      const resultado = await fn(client);
      return resultado;
    } finally {
      // SEMPRE fecha a conexão, com erro ou sem erro
      await client.end().catch((err) => {
        this.logger.warn(`Erro ao fechar conexão e-SUS: ${err.message}`);
      });
    }
  }

  /**
   * Testa se uma conexão e-SUS está funcionando.
   * Usado quando o admin cadastra/edita a conexão no painel.
   *
   * @returns { ok: boolean, mensagem: string, duracaoMs: number }
   */
  async testarConexao(credentials: {
    hostEncrypted: string;
    usuarioEncrypted: string;
    senhaEncrypted: string;
    porta: number;
    banco: string;
  }): Promise<{ ok: boolean; mensagem: string; duracaoMs: number }> {
    const inicio = Date.now();
    try {
      await this.withConnection(credentials, async (client) => {
        // Query simples só para confirmar que conecta e responde
        await client.query('SELECT 1');
      });
      return {
        ok: true,
        mensagem: 'Conexão estabelecida com sucesso',
        duracaoMs: Date.now() - inicio,
      };
    } catch (error) {
      this.logger.warn(`Falha no teste de conexão e-SUS: ${error.message}`);
      return {
        ok: false,
        mensagem: this.traduzirErro(error),
        duracaoMs: Date.now() - inicio,
      };
    }
  }

  /**
   * Busca um cidadão no e-SUS PEC pelo CPF.
   *
   * IMPORTANTE: a estrutura da query abaixo é um EXEMPLO baseado
   * na estrutura típica do e-SUS PEC. Os nomes reais de tabelas
   * e colunas devem ser confirmados com o banco do município
   * (geralmente a tabela é "tb_cidadao" no schema do e-SUS).
   *
   * Esta query é READ-ONLY (apenas SELECT).
   *
   * @param credentials — credenciais criptografadas
   * @param cpf — CPF normalizado (só dígitos) a buscar
   */
  async buscarCidadaoPorCpf(
    credentials: {
      hostEncrypted: string;
      usuarioEncrypted: string;
      senhaEncrypted: string;
      porta: number;
      banco: string;
    },
    cpf: string,
  ): Promise<Record<string, any> | null> {
    return this.withConnection(credentials, async (client) => {
      // ⚠️ AJUSTAR conforme a estrutura real do e-SUS do município.
      // Estrutura típica do e-SUS PEC: tabela tb_cidadao
      // Usamos query parametrizada ($1) para prevenir SQL injection.
      const query = `
        SELECT
          no_cidadao        AS nome,
          nu_cpf            AS cpf,
          nu_cns            AS cns,
          dt_nascimento     AS data_nascimento,
          no_sexo           AS sexo,
          no_mae            AS nome_mae,
          nu_telefone       AS telefone
        FROM tb_cidadao
        WHERE nu_cpf = $1
        LIMIT 1
      `;

      const resultado = await client.query(query, [cpf]);
      return resultado.rows.length > 0 ? resultado.rows[0] : null;
    });
  }

  /**
   * Traduz erros técnicos do PostgreSQL para mensagens amigáveis.
   */
  private traduzirErro(error: any): string {
    const msg = error.message || '';
    if (msg.includes('ECONNREFUSED'))
      return 'Servidor e-SUS recusou a conexão. Verifique host e porta.';
    if (msg.includes('ETIMEDOUT') || msg.includes('timeout'))
      return 'Tempo de conexão esgotado. O servidor e-SUS pode estar inacessível.';
    if (msg.includes('password authentication failed'))
      return 'Usuário ou senha do e-SUS incorretos.';
    if (msg.includes('does not exist'))
      return 'Banco de dados e-SUS não encontrado. Verifique o nome do banco.';
    if (msg.includes('ENOTFOUND'))
      return 'Host do e-SUS não encontrado. Verifique o endereço.';
    return `Erro ao conectar: ${msg}`;
  }
}

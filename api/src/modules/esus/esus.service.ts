import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { EsusConnectionService } from './esus-connection.service';
import { ConfigurarConexaoDto } from './dto/configurar-conexao.dto';
import { validarCpf, normalizarCpf } from '../../common/utils/cpf.util';

/**
 * EsusService
 *
 * Orquestra toda a integração com o e-SUS PEC:
 *  - Configurar a conexão do município (credenciais criptografadas)
 *  - Testar a conexão
 *  - Buscar pacientes no e-SUS
 *  - Salvar snapshot imutável
 *  - Aplicar rate limiting
 *  - Registrar auditoria de cada acesso
 */
@Injectable()
export class EsusService {
  private readonly logger = new Logger(EsusService.name);
  private readonly rateLimitPorHora: number;

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private connection: EsusConnectionService,
    private config: ConfigService,
  ) {
    this.rateLimitPorHora = parseInt(
      this.config.get<string>('ESUS_RATE_LIMIT_PER_HOUR', '30'),
    );
  }

  /**
   * Configura (cria ou atualiza) a conexão e-SUS de um laboratório.
   * As credenciais são criptografadas antes de salvar.
   * Só ADMIN pode fazer isso (validado no controller).
   */
  async configurarConexao(
    dto: ConfigurarConexaoDto,
    laboratorioId: string,
    userId: string,
  ) {
    // Criptografa as credenciais sensíveis
    const dadosCriptografados = {
      hostEncrypted: this.crypto.encrypt(dto.host),
      usuarioEncrypted: this.crypto.encrypt(dto.usuario),
      senhaEncrypted: this.crypto.encrypt(dto.senha),
      porta: dto.porta || 5432,
      banco: dto.banco || 'esus',
    };

    // Testa a conexão antes de salvar
    const teste = await this.connection.testarConexao(dadosCriptografados);

    // Salva (upsert: cria se não existe, atualiza se existe)
    const conexao = await this.prisma.esusConexao.upsert({
      where: { laboratorioId },
      create: {
        laboratorioId,
        criadoPorId: userId,
        ...dadosCriptografados,
        ativa: teste.ok,
        ultimoTesteEm: new Date(),
        statusConexao: teste.ok ? 'OK' : 'ERRO',
        erroConexao: teste.ok ? null : teste.mensagem,
      },
      update: {
        ...dadosCriptografados,
        ativa: teste.ok,
        ultimoTesteEm: new Date(),
        statusConexao: teste.ok ? 'OK' : 'ERRO',
        erroConexao: teste.ok ? null : teste.mensagem,
      },
    });

    this.logger.log(
      `Conexão e-SUS configurada — lab: ${laboratorioId} — status: ${conexao.statusConexao}`,
    );

    // Retorna sem expor as credenciais
    return {
      id: conexao.id,
      porta: conexao.porta,
      banco: conexao.banco,
      ativa: conexao.ativa,
      statusConexao: conexao.statusConexao,
      erroConexao: conexao.erroConexao,
      ultimoTesteEm: conexao.ultimoTesteEm,
      testeResultado: teste,
    };
  }

  /**
   * Retorna o status da conexão e-SUS do laboratório (sem credenciais).
   */
  async obterStatusConexao(laboratorioId: string) {
    const conexao = await this.prisma.esusConexao.findUnique({
      where: { laboratorioId },
      select: {
        id: true,
        porta: true,
        banco: true,
        ativa: true,
        statusConexao: true,
        erroConexao: true,
        ultimoTesteEm: true,
        createdAt: true,
      },
    });

    if (!conexao) {
      return { configurada: false };
    }

    return { configurada: true, ...conexao };
  }

  /**
   * Testa novamente a conexão já cadastrada.
   */
  async testarConexaoExistente(laboratorioId: string) {
    const conexao = await this.obterConexaoCompleta(laboratorioId);
    const teste = await this.connection.testarConexao(conexao);

    // Atualiza o status no banco
    await this.prisma.esusConexao.update({
      where: { laboratorioId },
      data: {
        ultimoTesteEm: new Date(),
        statusConexao: teste.ok ? 'OK' : 'ERRO',
        erroConexao: teste.ok ? null : teste.mensagem,
        ativa: teste.ok,
      },
    });

    return teste;
  }

  /**
   * Busca um paciente no e-SUS pelo CPF.
   *
   * Fluxo completo:
   *  1. Valida o CPF
   *  2. Verifica rate limiting (anti-scraping)
   *  3. Conecta ao e-SUS e busca
   *  4. Salva snapshot imutável (se encontrado)
   *  5. Registra auditoria
   *  6. Retorna os dados
   */
  async buscarPaciente(
    cpf: string,
    laboratorioId: string,
    userId: string,
    ip: string,
    userAgent?: string,
  ) {
    // 1. Valida CPF
    if (!validarCpf(cpf)) {
      throw new BadRequestException('CPF inválido');
    }
    const cpfLimpo = normalizarCpf(cpf);
    const cpfHash = this.crypto.hashCpf(cpfLimpo);

    // 2. Rate limiting — conta buscas na última hora
    await this.verificarRateLimit(userId);

    // 3. Obtém a conexão configurada
    const conexao = await this.obterConexaoCompleta(laboratorioId);
    if (!conexao.ativa) {
      throw new BadRequestException(
        'Conexão e-SUS inativa. Verifique a configuração.',
      );
    }

    // 4. Busca no e-SUS, medindo o tempo
    const inicio = Date.now();
    let cidadao: Record<string, any> | null = null;
    let erro: string | null = null;

    try {
      cidadao = await this.connection.buscarCidadaoPorCpf(conexao, cpfLimpo);
    } catch (e) {
      erro = e.message;
      this.logger.error(`Erro ao buscar no e-SUS: ${e.message}`);
    }
    const duracaoMs = Date.now() - inicio;

    // 5. Registra auditoria (SEMPRE, com sucesso ou erro)
    await this.prisma.esusAccessLog.create({
      data: {
        laboratorioId,
        userId,
        cpfHashConsultado: cpfHash,
        encontrado: !!cidadao,
        duracaoMs,
        ip,
        userAgent,
        erro,
      },
    });

    // Se deu erro de conexão, avisa
    if (erro) {
      throw new BadRequestException(
        'Não foi possível consultar o e-SUS no momento. Tente novamente.',
      );
    }

    // Se não encontrou
    if (!cidadao) {
      return { encontrado: false, mensagem: 'Paciente não encontrado no e-SUS' };
    }

    // 6. Salva snapshot imutável com hash de integridade
    const hashIntegridade = this.crypto.hashObject(cidadao);
    const snapshot = await this.prisma.pacienteEsusSnapshot.create({
      data: {
        laboratorioId,
        cpfHash,
        dadosBrutos: cidadao,
        hashIntegridade,
        buscadoPorId: userId,
        ipBusca: ip,
      },
    });

    this.logger.log(`Paciente encontrado no e-SUS — snapshot: ${snapshot.id}`);

    // Retorna os dados encontrados + id do snapshot (para importar depois)
    return {
      encontrado: true,
      snapshotId: snapshot.id,
      dados: {
        nome: cidadao.nome,
        cpf: this.crypto.maskCpf(cidadao.cpf || cpfLimpo),
        cns: cidadao.cns,
        dataNascimento: cidadao.data_nascimento,
        sexo: cidadao.sexo,
        nomeMae: cidadao.nome_mae,
        telefone: cidadao.telefone,
      },
    };
  }

  // ─── Métodos privados ────────────────────────────────────────────

  /**
   * Obtém a conexão completa (com credenciais criptografadas)
   * para uso interno do service.
   */
  private async obterConexaoCompleta(laboratorioId: string) {
    const conexao = await this.prisma.esusConexao.findUnique({
      where: { laboratorioId },
    });

    if (!conexao) {
      throw new NotFoundException(
        'Conexão e-SUS não configurada para este laboratório',
      );
    }

    return conexao;
  }

  /**
   * Verifica se o usuário não excedeu o limite de buscas por hora.
   * Proteção anti-scraping (extração massiva de dados).
   */
  private async verificarRateLimit(userId: string) {
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);

    const buscasNaUltimaHora = await this.prisma.esusAccessLog.count({
      where: {
        userId,
        createdAt: { gte: umaHoraAtras },
      },
    });

    if (buscasNaUltimaHora >= this.rateLimitPorHora) {
      this.logger.warn(`Rate limit excedido — userId: ${userId}`);
      throw new ForbiddenException(
        `Limite de ${this.rateLimitPorHora} buscas por hora atingido. Tente mais tarde.`,
      );
    }
  }
}

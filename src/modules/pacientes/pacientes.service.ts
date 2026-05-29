import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { validarCpf, normalizarCpf, mascararCpf } from '../../common/utils/cpf.util';
import { Paciente } from '@prisma/client';

/**
 * PacientesService
 *
 * O CORAÇÃO da conformidade LGPD do sistema.
 *
 * Fluxo de criptografia ao SALVAR:
 *   CPF puro "12345678900"
 *     → cpfHash = HMAC(CPF)        [para buscar sem expor]
 *     → cpfEncrypted = AES(CPF)    [para exibir quando autorizado]
 *
 * Fluxo ao LER:
 *   cpfEncrypted (do banco) → decrypt → CPF puro → mascarado para exibição
 *
 * Resultado: se alguém abrir a tabela no banco, vê só texto embaralhado.
 */
@Injectable()
export class PacientesService {
  private readonly logger = new Logger(PacientesService.name);

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  /**
   * Cria um paciente com todos os dados sensíveis criptografados.
   */
  async create(dto: CreatePacienteDto, laboratorioId: string) {
    // 1. Valida o CPF brasileiro
    if (!validarCpf(dto.cpf)) {
      throw new BadRequestException('CPF inválido');
    }
    const cpfLimpo = normalizarCpf(dto.cpf);

    // 2. Gera o hash do CPF (para busca) — determinístico
    const cpfHash = this.crypto.hashCpf(cpfLimpo);

    // 3. Verifica se já existe paciente com esse CPF NESTE laboratório
    const existente = await this.prisma.paciente.findFirst({
      where: { laboratorioId, cpfHash },
    });
    if (existente) {
      throw new ConflictException('Já existe um paciente com este CPF');
    }

    // 4. Confirma que a unidade pertence ao laboratório
    const unidade = await this.prisma.unidadeSaude.findFirst({
      where: { id: dto.unidadeId, laboratorioId },
    });
    if (!unidade) {
      throw new BadRequestException('Unidade de saúde inválida');
    }

    // 5. Criptografa todos os dados sensíveis (LGPD)
    const paciente = await this.prisma.paciente.create({
      data: {
        laboratorioId,
        unidadeId: dto.unidadeId,
        nome: dto.nome,
        cpfHash,
        cpfEncrypted: this.crypto.encrypt(cpfLimpo),
        cns: dto.cns,
        dataNascimento: new Date(dto.dataNascimento),
        sexo: dto.sexo,
        // Campos opcionais — só criptografa se vierem preenchidos
        nomeMaeEncrypted: dto.nomeMae ? this.crypto.encrypt(dto.nomeMae) : null,
        telefoneEncrypted: dto.telefone ? this.crypto.encrypt(dto.telefone) : null,
        whatsappEncrypted: dto.whatsapp ? this.crypto.encrypt(dto.whatsapp) : null,
        emailEncrypted: dto.email ? this.crypto.encrypt(dto.email) : null,
        enderecoEncrypted: dto.endereco
          ? this.crypto.encrypt(JSON.stringify(dto.endereco))
          : undefined,
        origem: 'LOCAL',
      },
    });

    this.logger.log(`Paciente criado: ${paciente.nome} — lab: ${laboratorioId}`);

    // Retorna os dados já descriptografados e mascarados para exibição
    return this.toSafeResponse(paciente);
  }

  /**
   * Lista pacientes do laboratório (com paginação e busca por nome).
   * NÃO descriptografa tudo na listagem — só o necessário (performance + segurança).
   */
  async findAll(
    laboratorioId: string,
    params: { busca?: string; pagina?: number; limite?: number },
  ) {
    const pagina = params.pagina || 1;
    const limite = Math.min(params.limite || 20, 100); // máx 100 por página
    const skip = (pagina - 1) * limite;

    const where = {
      laboratorioId,
      ativo: true,
      // Busca por nome (não criptografado, permite busca textual)
      ...(params.busca && {
        nome: { contains: params.busca, mode: 'insensitive' as const },
      }),
    };

    const [pacientes, total] = await Promise.all([
      this.prisma.paciente.findMany({
        where,
        skip,
        take: limite,
        orderBy: { nome: 'asc' },
        include: {
          unidade: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.paciente.count({ where }),
    ]);

    return {
      dados: pacientes.map((p) => this.toListResponse(p)),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Busca um paciente pelo CPF (usando o hash, sem expor o dado).
   */
  async findByCpf(cpf: string, laboratorioId: string) {
    if (!validarCpf(cpf)) {
      throw new BadRequestException('CPF inválido');
    }
    const cpfHash = this.crypto.hashCpf(normalizarCpf(cpf));

    const paciente = await this.prisma.paciente.findFirst({
      where: { laboratorioId, cpfHash },
      include: { unidade: { select: { id: true, nome: true } } },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.toSafeResponse(paciente);
  }

  /**
   * Busca um paciente pelo ID, com todos os dados descriptografados.
   */
  async findOne(id: string, laboratorioId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id, laboratorioId },
      include: { unidade: { select: { id: true, nome: true } } },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.toSafeResponse(paciente);
  }

  /**
   * Atualiza dados de um paciente, recriptografando o que mudou.
   */
  async update(id: string, dto: UpdatePacienteDto, laboratorioId: string) {
    // Garante que existe e pertence ao laboratório
    await this.findOne(id, laboratorioId);

    // Monta o objeto de atualização criptografando o que veio
    const data: any = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.cns !== undefined) data.cns = dto.cns;
    if (dto.dataNascimento !== undefined)
      data.dataNascimento = new Date(dto.dataNascimento);
    if (dto.sexo !== undefined) data.sexo = dto.sexo;
    if (dto.unidadeId !== undefined) {
      const unidade = await this.prisma.unidadeSaude.findFirst({
        where: { id: dto.unidadeId, laboratorioId },
      });
      if (!unidade) throw new BadRequestException('Unidade inválida');
      data.unidadeId = dto.unidadeId;
    }
    // Campos sensíveis — recriptografa
    if (dto.nomeMae !== undefined)
      data.nomeMaeEncrypted = dto.nomeMae ? this.crypto.encrypt(dto.nomeMae) : null;
    if (dto.telefone !== undefined)
      data.telefoneEncrypted = dto.telefone ? this.crypto.encrypt(dto.telefone) : null;
    if (dto.whatsapp !== undefined)
      data.whatsappEncrypted = dto.whatsapp ? this.crypto.encrypt(dto.whatsapp) : null;
    if (dto.email !== undefined)
      data.emailEncrypted = dto.email ? this.crypto.encrypt(dto.email) : null;
    if (dto.endereco !== undefined)
      data.enderecoEncrypted = dto.endereco
        ? this.crypto.encrypt(JSON.stringify(dto.endereco))
        : null;

    const paciente = await this.prisma.paciente.update({
      where: { id },
      data,
      include: { unidade: { select: { id: true, nome: true } } },
    });

    this.logger.log(`Paciente atualizado: ${paciente.nome}`);
    return this.toSafeResponse(paciente);
  }

  /**
   * "Remove" um paciente (soft delete — apenas marca como inativo).
   * Nunca apagamos pacientes de verdade (histórico médico + LGPD).
   */
  async remove(id: string, laboratorioId: string) {
    await this.findOne(id, laboratorioId);

    await this.prisma.paciente.update({
      where: { id },
      data: { ativo: false },
    });

    return { message: 'Paciente desativado com sucesso' };
  }

  // ─── Métodos privados de formatação ──────────────────────────────

  /**
   * Converte um paciente do banco em resposta segura,
   * descriptografando os dados sensíveis para exibição.
   * O CPF é mascarado por padrão (LGPD).
   */
  private toSafeResponse(paciente: Paciente & { unidade?: any }) {
    const cpf = this.crypto.decrypt(paciente.cpfEncrypted);

    return {
      id: paciente.id,
      nome: paciente.nome,
      cpf: mascararCpf(cpf), // CPF mascarado: 123.***.**9-00
      cns: paciente.cns,
      dataNascimento: paciente.dataNascimento,
      sexo: paciente.sexo,
      nomeMae: paciente.nomeMaeEncrypted
        ? this.crypto.decrypt(paciente.nomeMaeEncrypted)
        : null,
      telefone: paciente.telefoneEncrypted
        ? this.crypto.decrypt(paciente.telefoneEncrypted)
        : null,
      whatsapp: paciente.whatsappEncrypted
        ? this.crypto.decrypt(paciente.whatsappEncrypted)
        : null,
      email: paciente.emailEncrypted
        ? this.crypto.decrypt(paciente.emailEncrypted)
        : null,
      endereco: paciente.enderecoEncrypted
        ? JSON.parse(this.crypto.decrypt(paciente.enderecoEncrypted as string))
        : null,
      origem: paciente.origem,
      unidade: paciente.unidade,
      ativo: paciente.ativo,
      createdAt: paciente.createdAt,
    };
  }

  /**
   * Versão enxuta para listagem — não descriptografa dados pesados,
   * só o essencial (nome já está em claro). Melhor performance.
   */
  private toListResponse(paciente: Paciente & { unidade?: any }) {
    return {
      id: paciente.id,
      nome: paciente.nome,
      cpf: mascararCpf(this.crypto.decrypt(paciente.cpfEncrypted)),
      dataNascimento: paciente.dataNascimento,
      sexo: paciente.sexo,
      origem: paciente.origem,
      unidade: paciente.unidade,
      createdAt: paciente.createdAt,
    };
  }
}

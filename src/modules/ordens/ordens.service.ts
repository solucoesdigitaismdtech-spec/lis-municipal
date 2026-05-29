import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrdemDto } from './dto/create-ordem.dto';
import { StatusOS, StatusItem } from '@prisma/client';

/**
 * OrdensService
 *
 * Gerencia as Ordens de Serviço (OS) — o pedido de exames.
 *
 * Uma OS conecta:
 *   - 1 paciente
 *   - 1 unidade de saúde
 *   - N exames (cada um vira um "item" da ordem)
 *
 * Fluxo de status da OS:
 *   ABERTA → EM_COLETA → EM_ANALISE → CONCLUIDA
 *
 * Cada exame (item) tem seu próprio status independente.
 */
@Injectable()
export class OrdensService {
  private readonly logger = new Logger(OrdensService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma nova ordem de serviço com seus exames.
   * Gera um número de protocolo único automaticamente.
   */
  async create(dto: CreateOrdemDto, laboratorioId: string, solicitanteId: string) {
    // 1. Valida que o paciente pertence ao laboratório
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: dto.pacienteId, laboratorioId, ativo: true },
    });
    if (!paciente) {
      throw new BadRequestException('Paciente não encontrado');
    }

    // 2. Valida a unidade
    const unidade = await this.prisma.unidadeSaude.findFirst({
      where: { id: dto.unidadeId, laboratorioId },
    });
    if (!unidade) {
      throw new BadRequestException('Unidade não encontrada');
    }

    // 3. Valida que há pelo menos um exame e que todos existem
    if (!dto.exameIds || dto.exameIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um exame');
    }
    const exames = await this.prisma.exameCatalogo.findMany({
      where: { id: { in: dto.exameIds }, laboratorioId, ativo: true },
    });
    if (exames.length !== dto.exameIds.length) {
      throw new BadRequestException('Um ou mais exames são inválidos');
    }

    // 4. Gera o protocolo único: LAB-AAAAMMDD-XXXXX
    const protocolo = await this.gerarProtocolo(laboratorioId);

    // 5. Cria a OS + os itens (exames) em uma transação
    const ordem = await this.prisma.ordemServico.create({
      data: {
        laboratorioId,
        protocolo,
        pacienteId: dto.pacienteId,
        unidadeId: dto.unidadeId,
        solicitanteId,
        medicoSolicitante: dto.medicoSolicitante,
        prioridade: dto.prioridade ?? 'NORMAL',
        observacoes: dto.observacoes,
        // Cria um item para cada exame, calculando o prazo de entrega
        itens: {
          create: exames.map((exame) => ({
            exameId: exame.id,
            prazoEntrega: new Date(Date.now() + exame.prazoHoras * 60 * 60 * 1000),
          })),
        },
      },
      include: {
        itens: { include: { exame: { select: { nome: true, codigo: true } } } },
      },
    });

    this.logger.log(`OS criada: ${protocolo} — ${exames.length} exame(s)`);
    return ordem;
  }

  /**
   * Lista as ordens do laboratório, com filtro por status.
   */
  async findAll(
    laboratorioId: string,
    filtros: { status?: string; pagina?: number; limite?: number },
  ) {
    const pagina = filtros.pagina || 1;
    const limite = Math.min(filtros.limite || 20, 100);
    const skip = (pagina - 1) * limite;

    const where = {
      laboratorioId,
      ...(filtros.status && { status: filtros.status as StatusOS }),
    };

    const [ordens, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        skip,
        take: limite,
        orderBy: { createdAt: 'desc' },
        include: {
          paciente: { select: { id: true, nome: true } },
          unidade: { select: { id: true, nome: true } },
          _count: { select: { itens: true } },
        },
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    return {
      dados: ordens,
      paginacao: { pagina, limite, total, totalPaginas: Math.ceil(total / limite) },
    };
  }

  /**
   * Busca uma OS específica com todos os detalhes.
   */
  async findOne(id: string, laboratorioId: string) {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id, laboratorioId },
      include: {
        paciente: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
        solicitante: { select: { id: true, name: true } },
        itens: {
          include: {
            exame: { select: { nome: true, codigo: true, material: true } },
          },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return ordem;
  }

  /**
   * Registra a coleta de um item (exame) da ordem.
   * Atualiza o status do item para COLETADO.
   */
  async registrarColeta(
    ordemId: string,
    itemId: string,
    laboratorioId: string,
  ) {
    // Confirma que a OS pertence ao laboratório
    await this.findOne(ordemId, laboratorioId);

    const item = await this.prisma.itemOrdem.findFirst({
      where: { id: itemId, ordemId },
    });
    if (!item) {
      throw new NotFoundException('Item da ordem não encontrado');
    }

    const itemAtualizado = await this.prisma.itemOrdem.update({
      where: { id: itemId },
      data: {
        status: StatusItem.COLETADO,
        coletadoEm: new Date(),
      },
    });

    // Atualiza o status geral da OS se necessário
    await this.atualizarStatusOrdem(ordemId);

    return itemAtualizado;
  }

  /**
   * Cancela uma ordem de serviço.
   */
  async cancelar(id: string, laboratorioId: string) {
    const ordem = await this.findOne(id, laboratorioId);

    if (ordem.status === StatusOS.CONCLUIDA) {
      throw new BadRequestException('Não é possível cancelar uma OS concluída');
    }

    return this.prisma.ordemServico.update({
      where: { id },
      data: { status: StatusOS.CANCELADA },
    });
  }

  // ─── Métodos privados ────────────────────────────────────────────

  /**
   * Gera um protocolo único no formato LAB-AAAAMMDD-NNNNN.
   * O número sequencial é baseado na contagem de OS do dia.
   */
  private async gerarProtocolo(laboratorioId: string): Promise<string> {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataStr = `${ano}${mes}${dia}`;

    // Conta quantas OS já existem hoje neste laboratório
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const contagem = await this.prisma.ordemServico.count({
      where: { laboratorioId, createdAt: { gte: inicioDia } },
    });

    const sequencial = String(contagem + 1).padStart(5, '0');
    return `LAB-${dataStr}-${sequencial}`;
  }

  /**
   * Atualiza o status geral da OS com base no status dos itens.
   * Se todos os itens foram coletados, a OS passa para EM_ANALISE.
   */
  private async atualizarStatusOrdem(ordemId: string) {
    const itens = await this.prisma.itemOrdem.findMany({
      where: { ordemId },
    });

    const todosColetados = itens.every(
      (i) => i.status !== StatusItem.AGUARDANDO_COLETA,
    );
    const algumColetado = itens.some(
      (i) => i.status !== StatusItem.AGUARDANDO_COLETA,
    );

    let novoStatus: StatusOS | null = null;
    if (todosColetados) {
      novoStatus = StatusOS.EM_ANALISE;
    } else if (algumColetado) {
      novoStatus = StatusOS.EM_COLETA;
    }

    if (novoStatus) {
      await this.prisma.ordemServico.update({
        where: { id: ordemId },
        data: { status: novoStatus },
      });
    }
  }
}

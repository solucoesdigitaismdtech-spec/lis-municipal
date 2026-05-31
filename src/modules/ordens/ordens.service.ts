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
 * OrdensService — SESSÃO 1 (fluxo real)
 *
 * Fluxo de status da OS (agora refletindo o laboratório real):
 *   AGENDADA → COLETA_REALIZADA → EM_DIGITACAO → EM_ANALISE → LIBERADA
 *
 * Quem faz o quê:
 *   - Técnico/Admin: cria OS (agendamento), registra coleta, digita
 *   - Biomédico: valida e assina
 */
@Injectable()
export class OrdensService {
  private readonly logger = new Logger(OrdensService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma OS com agendamento da coleta.
   * Já nasce com status AGENDADA e gera o protocolo (base do QR Code
   * que o paciente recebe para acompanhar de casa).
   */
  async create(dto: CreateOrdemDto, laboratorioId: string, solicitanteId: string) {
    const paciente = await this.prisma.paciente.findFirst({
      where: { id: dto.pacienteId, laboratorioId, ativo: true },
    });
    if (!paciente) {
      throw new BadRequestException('Paciente não encontrado');
    }

    const unidade = await this.prisma.unidadeSaude.findFirst({
      where: { id: dto.unidadeId, laboratorioId },
    });
    if (!unidade) {
      throw new BadRequestException('Unidade não encontrada');
    }

    if (!dto.exameIds || dto.exameIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um exame');
    }
    const exames = await this.prisma.exameCatalogo.findMany({
      where: { id: { in: dto.exameIds }, laboratorioId, ativo: true },
    });
    if (exames.length !== dto.exameIds.length) {
      throw new BadRequestException('Um ou mais exames são inválidos');
    }

    const protocolo = await this.gerarProtocolo(laboratorioId);

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
        status: StatusOS.AGENDADA,
        // Data agendada para a coleta (se não informada, usa hoje)
        dataAgendamento: dto.dataAgendamento ? new Date(dto.dataAgendamento) : new Date(),
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

    this.logger.log(`OS agendada: ${protocolo} — ${exames.length} exame(s)`);
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
   * NOVO — Agenda do dia: lista as OS agendadas para uma data.
   * Usado na recepção do laboratório para ver quem vem coletar hoje.
   */
  async agendaDoDia(laboratorioId: string, data?: string) {
    // Define o intervalo do dia (00:00 até 23:59)
    const dia = data ? new Date(data) : new Date();
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const fim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59);

    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        laboratorioId,
        dataAgendamento: { gte: inicio, lte: fim },
        status: { in: [StatusOS.AGENDADA, StatusOS.COLETA_REALIZADA] },
      },
      orderBy: [{ prioridade: 'desc' }, { dataAgendamento: 'asc' }],
      include: {
        paciente: { select: { id: true, nome: true } },
        unidade: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
    });

    return {
      data: inicio.toISOString().split('T')[0],
      total: ordens.length,
      ordens,
    };
  }

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
   * Quando o primeiro item é coletado, a OS vai para COLETA_REALIZADA.
   */
  async registrarColeta(ordemId: string, itemId: string, laboratorioId: string) {
    await this.findOne(ordemId, laboratorioId);

    const item = await this.prisma.itemOrdem.findFirst({
      where: { id: itemId, ordemId },
    });
    if (!item) {
      throw new NotFoundException('Item da ordem não encontrado');
    }

    const itemAtualizado = await this.prisma.itemOrdem.update({
      where: { id: itemId },
      data: { status: StatusItem.COLETADO, coletadoEm: new Date() },
    });

    await this.atualizarStatusOrdem(ordemId);
    return itemAtualizado;
  }

  /**
   * Registra a coleta de TODOS os itens de uma vez (coleta completa).
   * Atalho útil quando todos os exames usam o mesmo material/momento.
   */
  async registrarColetaCompleta(ordemId: string, laboratorioId: string) {
    await this.findOne(ordemId, laboratorioId);

    await this.prisma.itemOrdem.updateMany({
      where: { ordemId, status: StatusItem.AGUARDANDO_COLETA },
      data: { status: StatusItem.COLETADO, coletadoEm: new Date() },
    });

    await this.prisma.ordemServico.update({
      where: { id: ordemId },
      data: { status: StatusOS.COLETA_REALIZADA, dataColeta: new Date() },
    });

    this.logger.log(`Coleta completa registrada — OS ${ordemId}`);
    return { message: 'Coleta de todos os exames registrada' };
  }

  async cancelar(id: string, laboratorioId: string) {
    const ordem = await this.findOne(id, laboratorioId);

    if (ordem.status === StatusOS.LIBERADA || ordem.status === StatusOS.CONCLUIDA) {
      throw new BadRequestException('Não é possível cancelar uma OS já liberada');
    }

    return this.prisma.ordemServico.update({
      where: { id },
      data: { status: StatusOS.CANCELADA },
    });
  }

  // ─── Métodos privados ────────────────────────────────────────────

  private async gerarProtocolo(laboratorioId: string): Promise<string> {
    const hoje = new Date();
    const dataStr = `${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`;

    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const contagem = await this.prisma.ordemServico.count({
      where: { laboratorioId, createdAt: { gte: inicioDia } },
    });

    const sequencial = String(contagem + 1).padStart(5, '0');
    return `LAB-${dataStr}-${sequencial}`;
  }

  /**
   * Atualiza o status da OS conforme o andamento dos itens.
   */
  private async atualizarStatusOrdem(ordemId: string) {
    const itens = await this.prisma.itemOrdem.findMany({ where: { ordemId } });

    const algumColetado = itens.some(
      (i) => i.status !== StatusItem.AGUARDANDO_COLETA,
    );

    if (algumColetado) {
      const ordem = await this.prisma.ordemServico.findUnique({ where: { id: ordemId } });
      // Só atualiza se ainda estiver em fase inicial
      if (ordem && (ordem.status === StatusOS.AGENDADA || ordem.status === StatusOS.ABERTA)) {
        await this.prisma.ordemServico.update({
          where: { id: ordemId },
          data: { status: StatusOS.COLETA_REALIZADA, dataColeta: new Date() },
        });
      }
    }
  }
}

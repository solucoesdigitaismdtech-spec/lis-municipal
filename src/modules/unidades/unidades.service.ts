import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

/**
 * UnidadesService
 *
 * Gerencia unidades de saúde dentro de um laboratório.
 *
 * Regra de ouro do multi-tenant:
 * TODO método recebe o laboratorioId do usuário logado e filtra por ele.
 * Isso garante que um laboratório nunca veja/edite unidades de outro.
 */
@Injectable()
export class UnidadesService {
  private readonly logger = new Logger(UnidadesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma unidade de saúde no laboratório do usuário.
   */
  async create(dto: CreateUnidadeDto, laboratorioId: string) {
    // Se informou CNES, verifica duplicidade dentro do mesmo laboratório
    if (dto.cnes) {
      const existing = await this.prisma.unidadeSaude.findFirst({
        where: { laboratorioId, cnes: dto.cnes },
      });
      if (existing) {
        throw new ConflictException(
          'Já existe uma unidade com este CNES neste laboratório',
        );
      }
    }

    const unidade = await this.prisma.unidadeSaude.create({
      data: {
        nome: dto.nome,
        cnes: dto.cnes,
        endereco: dto.endereco,
        tipo: dto.tipo,
        laboratorioId,
      },
    });

    this.logger.log(`Unidade criada: ${unidade.nome} — lab: ${laboratorioId}`);
    return unidade;
  }

  /**
   * Lista todas as unidades do laboratório do usuário.
   */
  async findAll(laboratorioId: string) {
    return this.prisma.unidadeSaude.findMany({
      where: { laboratorioId },
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { pacientes: true, ordens: true } },
      },
    });
  }

  /**
   * Busca uma unidade específica, garantindo que pertence ao laboratório.
   */
  async findOne(id: string, laboratorioId: string) {
    const unidade = await this.prisma.unidadeSaude.findFirst({
      where: { id, laboratorioId },
    });

    if (!unidade) {
      throw new NotFoundException('Unidade não encontrada');
    }

    return unidade;
  }

  /**
   * Atualiza uma unidade do laboratório.
   */
  async update(id: string, dto: UpdateUnidadeDto, laboratorioId: string) {
    // Garante que a unidade pertence ao laboratório antes de atualizar
    await this.findOne(id, laboratorioId);

    const unidade = await this.prisma.unidadeSaude.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Unidade atualizada: ${unidade.nome}`);
    return unidade;
  }

  /**
   * Ativa/desativa uma unidade.
   */
  async toggleActive(id: string, ativa: boolean, laboratorioId: string) {
    await this.findOne(id, laboratorioId);

    return this.prisma.unidadeSaude.update({
      where: { id },
      data: { ativa },
      select: { id: true, nome: true, ativa: true },
    });
  }
}

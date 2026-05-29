import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExameDto } from './dto/create-exame.dto';
import { UpdateExameDto } from './dto/update-exame.dto';
import { CreateValorReferenciaDto } from './dto/create-valor-referencia.dto';

/**
 * ExamesService
 *
 * Gerencia o catálogo de exames de cada laboratório e seus
 * valores de referência (as faixas normais de cada resultado).
 *
 * Exemplo: o exame "Hemograma" pode ter vários valores de
 * referência — um para Hemoglobina, outro para Leucócitos, etc.
 */
@Injectable()
export class ExamesService {
  private readonly logger = new Logger(ExamesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um exame no catálogo do laboratório.
   * O código é único por laboratório.
   */
  async create(dto: CreateExameDto, laboratorioId: string) {
    const existente = await this.prisma.exameCatalogo.findFirst({
      where: { laboratorioId, codigo: dto.codigo },
    });
    if (existente) {
      throw new ConflictException('Já existe um exame com este código');
    }

    const exame = await this.prisma.exameCatalogo.create({
      data: {
        laboratorioId,
        codigo: dto.codigo,
        nome: dto.nome,
        sigtap: dto.sigtap,
        metodo: dto.metodo,
        material: dto.material,
        categoria: dto.categoria,
        prazoHoras: dto.prazoHoras ?? 24,
        instrucoes: dto.instrucoes,
      },
    });

    this.logger.log(`Exame criado: ${exame.nome} (${exame.codigo})`);
    return exame;
  }

  /**
   * Lista os exames do catálogo do laboratório.
   * Pode filtrar por categoria e por busca textual no nome.
   */
  async findAll(
    laboratorioId: string,
    filtros: { categoria?: string; busca?: string },
  ) {
    return this.prisma.exameCatalogo.findMany({
      where: {
        laboratorioId,
        ativo: true,
        ...(filtros.categoria && { categoria: filtros.categoria as any }),
        ...(filtros.busca && {
          nome: { contains: filtros.busca, mode: 'insensitive' },
        }),
      },
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { valoresRef: true } },
      },
    });
  }

  /**
   * Busca um exame específico com seus valores de referência.
   */
  async findOne(id: string, laboratorioId: string) {
    const exame = await this.prisma.exameCatalogo.findFirst({
      where: { id, laboratorioId },
      include: {
        valoresRef: { orderBy: { campo: 'asc' } },
      },
    });

    if (!exame) {
      throw new NotFoundException('Exame não encontrado');
    }

    return exame;
  }

  /**
   * Atualiza um exame do catálogo.
   */
  async update(id: string, dto: UpdateExameDto, laboratorioId: string) {
    await this.findOne(id, laboratorioId);

    const exame = await this.prisma.exameCatalogo.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Exame atualizado: ${exame.nome}`);
    return exame;
  }

  /**
   * Desativa um exame (soft delete — preserva o histórico).
   */
  async remove(id: string, laboratorioId: string) {
    await this.findOne(id, laboratorioId);
    await this.prisma.exameCatalogo.update({
      where: { id },
      data: { ativo: false },
    });
    return { message: 'Exame desativado com sucesso' };
  }

  // ─── Valores de referência ──────────────────────────────────────

  /**
   * Adiciona um valor de referência a um exame.
   * Ex: para o Hemograma, adicionar "Hemoglobina: 12-16 g/dL".
   */
  async addValorReferencia(
    exameId: string,
    dto: CreateValorReferenciaDto,
    laboratorioId: string,
  ) {
    // Confirma que o exame pertence ao laboratório
    await this.findOne(exameId, laboratorioId);

    const valor = await this.prisma.valorReferencia.create({
      data: {
        exameId,
        campo: dto.campo,
        faixaIdade: dto.faixaIdade,
        sexo: dto.sexo,
        minimo: dto.minimo,
        maximo: dto.maximo,
        textoRef: dto.textoRef,
        unidade: dto.unidade,
        critico: dto.critico ?? false,
      },
    });

    this.logger.log(`Valor de referência adicionado ao exame ${exameId}: ${valor.campo}`);
    return valor;
  }

  /**
   * Remove um valor de referência.
   */
  async removeValorReferencia(
    exameId: string,
    valorId: string,
    laboratorioId: string,
  ) {
    await this.findOne(exameId, laboratorioId);

    const valor = await this.prisma.valorReferencia.findFirst({
      where: { id: valorId, exameId },
    });
    if (!valor) {
      throw new NotFoundException('Valor de referência não encontrado');
    }

    await this.prisma.valorReferencia.delete({ where: { id: valorId } });
    return { message: 'Valor de referência removido' };
  }
}

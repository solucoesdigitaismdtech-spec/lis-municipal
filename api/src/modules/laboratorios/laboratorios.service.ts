import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';

/**
 * LaboratoriosService
 *
 * Lógica de negócio para gerenciar laboratórios municipais.
 * Um laboratório representa um município contratante do sistema.
 */
@Injectable()
export class LaboratoriosService {
  private readonly logger = new Logger(LaboratoriosService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo laboratório (município).
   * O CNES é único — não pode haver dois laboratórios com mesmo CNES.
   */
  async create(dto: CreateLaboratorioDto) {
    // Verifica se já existe laboratório com esse CNES
    const existing = await this.prisma.laboratorio.findUnique({
      where: { cnes: dto.cnes },
    });

    if (existing) {
      throw new ConflictException('Já existe um laboratório com este CNES');
    }

    const laboratorio = await this.prisma.laboratorio.create({
      data: {
        nome: dto.nome,
        cnes: dto.cnes,
        municipio: dto.municipio,
        uf: dto.uf.toUpperCase(),
        cnpj: dto.cnpj,
        responsavelTecnico: dto.responsavelTecnico,
        crbm: dto.crbm,
      },
    });

    this.logger.log(`Laboratório criado: ${laboratorio.nome} (${laboratorio.municipio}/${laboratorio.uf})`);
    return laboratorio;
  }

  /**
   * Lista todos os laboratórios.
   * Operação de super admin (gestão da plataforma).
   */
  async findAll() {
    return this.prisma.laboratorio.findMany({
      orderBy: { nome: 'asc' },
      include: {
        // Conta quantos usuários e unidades cada lab tem
        _count: {
          select: { users: true, unidades: true, pacientes: true },
        },
      },
    });
  }

  /**
   * Busca um laboratório por ID.
   */
  async findOne(id: string) {
    const laboratorio = await this.prisma.laboratorio.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, unidades: true, pacientes: true, ordens: true },
        },
      },
    });

    if (!laboratorio) {
      throw new NotFoundException('Laboratório não encontrado');
    }

    return laboratorio;
  }

  /**
   * Atualiza os dados de um laboratório.
   * Um admin só pode atualizar o próprio laboratório (validado no controller).
   */
  async update(id: string, dto: UpdateLaboratorioDto) {
    // Garante que existe antes de atualizar
    await this.findOne(id);

    const laboratorio = await this.prisma.laboratorio.update({
      where: { id },
      data: {
        ...dto,
        // Se enviou UF, normaliza para maiúsculo
        ...(dto.uf && { uf: dto.uf.toUpperCase() }),
      },
    });

    this.logger.log(`Laboratório atualizado: ${laboratorio.nome}`);
    return laboratorio;
  }

  /**
   * Ativa ou desativa um laboratório.
   * Desativar bloqueia o acesso de todos os usuários do laboratório.
   */
  async toggleActive(id: string, ativo: boolean) {
    await this.findOne(id);

    return this.prisma.laboratorio.update({
      where: { id },
      data: { ativo },
      select: { id: true, nome: true, ativo: true },
    });
  }
}

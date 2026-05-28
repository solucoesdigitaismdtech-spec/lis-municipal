import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@prisma/client';

/**
 * UsersService
 *
 * Gerencia operações de usuários do sistema (staff).
 * Não confundir com pacientes — são os profissionais
 * que operam o LIS (admin, biomédico, técnico).
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  // Custo do bcrypt — 12 rounds é o mínimo recomendado para 2024
  private readonly BCRYPT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo usuário.
   * Apenas ADMIN pode chamar este método (verificado no controller).
   */
  async create(createUserDto: CreateUserDto, adminLaboratorioId: string) {
    // Verifica se já existe usuário com esse email
    const email = createUserDto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: {
        laboratorioId_email: {
          laboratorioId: adminLaboratorioId,
          email,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário com este email');
    }

    // Hash da senha com bcrypt
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.BCRYPT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email,
        passwordHash: hashedPassword,
        role: createUserDto.role,
        // Usuário sempre criado no mesmo laboratório do admin
        laboratorioId: adminLaboratorioId,
      },
      // Nunca retornar a senha
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        laboratorioId: true,
        createdAt: true,
      },
    });

    this.logger.log(`Usuário criado: ${user.email} — role: ${user.role}`);
    return user;
  }

  /**
   * Busca usuário por email.
   * Usado pelo AuthService no processo de login.
   * Retorna a senha para comparação com bcrypt.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
  }

  /**
   * Busca usuário por ID.
   * Usado pelo JwtStrategy para verificar se ainda está ativo.
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        laboratorioId: true,
      },
    });
  }

  /**
   * Lista todos os usuários do laboratório.
   * Técnicos e biomédicos só veem do próprio laboratório.
   */
  async findAll(laboratorioId: string) {
    return this.prisma.user.findMany({
      where: { laboratorioId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Ativa ou desativa um usuário.
   */
  async toggleActive(id: string, active: boolean, laboratorioId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, laboratorioId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, email: true, active: true },
    });
  }
}

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

/**
 * AuthService
 *
 * Contém toda a lógica de autenticação:
 *
 * 1. validateUser()  — verifica email/senha
 * 2. login()         — gera accessToken + refreshToken
 * 3. refresh()       — renova o accessToken com o refreshToken
 * 4. logout()        — revoga o refreshToken
 *
 * Sobre os tokens:
 *   accessToken  → JWT de curta duração (15min). Enviado no header
 *                  Authorization: Bearer <token> em cada requisição.
 *   refreshToken → JWT de longa duração (7 dias). Enviado apenas
 *                  na rota /auth/refresh para obter novo accessToken.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Valida as credenciais do usuário.
   * Chamado antes de gerar os tokens.
   *
   * @returns dados do usuário sem a senha, ou null se inválido
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    // Usuário não encontrado — mesmo erro genérico para não
    // revelar se o email existe ou não (segurança)
    if (!user) {
      return null;
    }

    // Usuário desativado pelo admin
    if (!user.active) {
      throw new ForbiddenException('Usuário desativado. Contate o administrador.');
    }

    // Compara a senha fornecida com o hash bcrypt salvo no banco
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Retorna o usuário sem o campo senha
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Realiza o login e gera os dois tokens.
   *
   * @param loginDto — { email, password }
   * @param ip — IP do cliente para auditoria
   * @returns { accessToken, refreshToken, user }
   */
  async login(loginDto: LoginDto, ip: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Registra tentativa falha de login para análise
      this.logger.warn(`Tentativa de login falha para: ${loginDto.email} — IP: ${ip}`);
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    // Gera os tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Atualiza o campo lastLoginAt no banco
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Registra o login bem-sucedido na auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        acao: 'LOGIN',
        entidade: 'User',
        entidadeId: user.id,
        ip,
      },
    });

    this.logger.log(`Login bem-sucedido: ${user.email} — IP: ${ip}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        laboratorioId: user.laboratorioId,
      },
    };
  }

  /**
   * Renova o accessToken usando um refreshToken válido.
   *
   * Implementa "refresh token rotation":
   * - O refreshToken usado é revogado
   * - Um novo refreshToken é gerado
   * - Isso limita a janela de ataque se um token for roubado
   *
   * @param userId — id do usuário (extraído do JWT pelo guard)
   * @param refreshToken — token recebido na requisição
   */
  async refresh(userId: string, refreshToken: string) {
    // Busca o token no banco e verifica se é válido
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Token já foi revogado (logout anterior ou rotação)
    if (storedToken.revokedAt) {
      // Possível ataque de reutilização — revoga todos os tokens do usuário
      await this.revokeAllUserTokens(userId);
      this.logger.warn(`Tentativa de reutilização de refresh token revogado — userId: ${userId}`);
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Token expirado
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    // Revoga o token atual (rotação)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Gera novos tokens
    const { user } = storedToken;
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return tokens;
  }

  /**
   * Realiza o logout revogando o refreshToken.
   */
  async logout(userId: string, refreshToken: string, ip: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        acao: 'LOGOUT',
        entidade: 'User',
        entidadeId: userId,
        ip,
      },
    });
  }

  // ─── Métodos privados ──────────────────────────────────────────

  /**
   * Gera accessToken e refreshToken para um usuário.
   * Salva o refreshToken no banco para controle de sessão.
   */
  private async generateTokens(userId: string, email: string, role: string) {
    // Payload do JWT — dados incluídos dentro do token
    const payload = { sub: userId, email, role };

    // accessToken — expira em 15min (configurável no .env)
    const accessToken = this.jwtService.sign(payload);

    // refreshToken — chave diferente e expiração maior (7 dias)
    const refreshToken = this.jwtService.sign(payload, {
  secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
  expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
});

    // Calcula a data de expiração para salvar no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Salva o refreshToken no banco
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Revoga todos os refreshTokens ativos de um usuário.
   * Usado em caso de detecção de reutilização de token (possível ataque).
   */
  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.warn(`Todos os tokens revogados para o usuário: ${userId}`);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

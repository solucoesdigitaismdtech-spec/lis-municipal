"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    usersService;
    jwtService;
    configService;
    prisma;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usersService, jwtService, configService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return null;
        }
        if (!user.active) {
            throw new common_1.ForbiddenException('Usuário desativado. Contate o administrador.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return null;
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async login(loginDto, ip) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            this.logger.warn(`Tentativa de login falha para: ${loginDto.email} — IP: ${ip}`);
            throw new common_1.UnauthorizedException('Email ou senha incorretos');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
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
    async refresh(userId, refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { tokenHash: this.hashToken(refreshToken) },
            include: { user: true },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Refresh token inválido');
        }
        if (storedToken.revokedAt) {
            await this.revokeAllUserTokens(userId);
            this.logger.warn(`Tentativa de reutilização de refresh token revogado — userId: ${userId}`);
            throw new common_1.UnauthorizedException('Refresh token inválido');
        }
        if (storedToken.expiresAt < new Date()) {
            await this.prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revokedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('Sessão expirada. Faça login novamente.');
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });
        const { user } = storedToken;
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return tokens;
    }
    async logout(userId, refreshToken, ip) {
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
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                tokenHash: this.hashToken(refreshToken),
                userId,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    async revokeAllUserTokens(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        this.logger.warn(`Todos os tokens revogados para o usuário: ${userId}`);
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
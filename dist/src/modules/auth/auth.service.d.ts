import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private prisma;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, prisma: PrismaService);
    validateUser(email: string, password: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
        twoFactorSecretEncrypted: string | null;
        twoFactorEnabled: boolean;
        lastLoginAt: Date | null;
        laboratorioId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    login(loginDto: LoginDto, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            laboratorioId: string;
        };
    }>;
    refresh(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken: string, ip: string): Promise<void>;
    private generateTokens;
    private revokeAllUserTokens;
    private hashToken;
}

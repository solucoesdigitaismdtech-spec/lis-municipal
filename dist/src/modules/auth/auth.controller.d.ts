import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: Request): Promise<{
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
    refresh(refreshTokenDto: RefreshTokenDto, user: {
        sub: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshTokenDto: RefreshTokenDto, user: {
        sub: string;
    }, req: Request): Promise<{
        message: string;
    }>;
}

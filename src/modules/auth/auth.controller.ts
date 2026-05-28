import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * AuthController
 *
 * Expõe os endpoints públicos e protegidos de autenticação.
 *
 * POST /auth/login    — recebe email/senha, retorna tokens
 * POST /auth/refresh  — recebe refreshToken, retorna novo accessToken
 * POST /auth/logout   — revoga o refreshToken
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   *
   * Corpo esperado: { "email": "...", "password": "..." }
   *
   * Retorna:
   * {
   *   "accessToken": "eyJ...",
   *   "refreshToken": "eyJ...",
   *   "user": { id, name, email, role }
   * }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // Retorna 200, não 201
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    // Extrai o IP real do cliente (considera proxies/nginx)
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    return this.authService.login(loginDto, ip);
  }

  /**
   * POST /auth/refresh
   *
   * Rota protegida pelo JwtRefreshGuard.
   * O guard valida o refreshToken antes de chegar aqui.
   *
   * Corpo esperado: { "refreshToken": "eyJ..." }
   *
   * Retorna: { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.authService.refresh(user.sub, refreshTokenDto.refreshToken);
  }

  /**
   * POST /auth/logout
   *
   * Rota protegida — requer accessToken válido.
   * Revoga o refreshToken para encerrar a sessão.
   *
   * Corpo esperado: { "refreshToken": "eyJ..." }
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUser() user: { sub: string },
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    await this.authService.logout(user.sub, refreshTokenDto.refreshToken, ip);
    return { message: 'Logout realizado com sucesso' };
  }
}

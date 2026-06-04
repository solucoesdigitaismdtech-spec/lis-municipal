import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard
 *
 * Protege rotas que exigem login.
 * Uso: @UseGuards(JwtAuthGuard)
 *
 * Se o accessToken for inválido ou ausente → 401 Unauthorized
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * JwtRefreshGuard
 *
 * Usado APENAS na rota POST /auth/refresh.
 * Valida o refreshToken no corpo da requisição.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

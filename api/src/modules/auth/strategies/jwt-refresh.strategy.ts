import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * JwtRefreshStrategy
 *
 * Estratégia separada usada APENAS na rota POST /auth/refresh.
 * Usa o JWT_REFRESH_SECRET (diferente do JWT_SECRET normal).
 *
 * Extrai o refreshToken do corpo da requisição (body),
 * não do header Authorization.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      // Extrai o refreshToken do corpo da requisição
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // passReqToCallback = true permite acessar o req no validate()
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string }) {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      // Passa o token completo para o AuthService revogar
      refreshToken: req.body?.refreshToken,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * JwtStrategy
 *
 * Esta estratégia é executada automaticamente quando uma rota
 * usa o @UseGuards(JwtAuthGuard).
 *
 * O que ela faz:
 * 1. Extrai o token do header: Authorization: Bearer <token>
 * 2. Verifica a assinatura do token com JWT_SECRET
 * 3. Chama validate() com o payload decodificado
 * 4. O retorno de validate() fica disponível como req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      // Extrai o token do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rejeita tokens expirados
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Chamado após verificação da assinatura do token.
   * O payload já foi decodificado e verificado pelo Passport.
   *
   * @param payload — dados dentro do JWT: { sub, email, role }
   * @returns objeto que ficará disponível como req.user
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    // Verifica se o usuário ainda existe e está ativo
    // (pode ter sido desativado após o token ser gerado)
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado');
    }

    // Este objeto fica em req.user em toda rota protegida
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      laboratorioId: user.laboratorioId,
    };
  }
}

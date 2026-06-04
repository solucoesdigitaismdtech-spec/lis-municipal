import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

/**
 * RolesGuard
 *
 * Verifica se o usuário logado tem o perfil necessário
 * para acessar uma rota específica.
 *
 * Funciona em conjunto com o decorator @Roles().
 *
 * Exemplo de uso no controller:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
 *   @Get('resultados')
 *   getResultados() { ... }
 *
 * Só ADMIN e BIOMEDICO conseguem acessar.
 * TECNICO recebe 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lê os roles definidos no decorator @Roles() da rota
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se a rota não tem @Roles(), qualquer usuário logado pode acessar
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Pega o usuário do request (preenchido pelo JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    const hasRole = requiredRoles.includes(user?.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Requer perfil: ${requiredRoles.join(' ou ')}`,
      );
    }

    return true;
  }
}

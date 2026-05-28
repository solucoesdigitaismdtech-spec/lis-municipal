import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * ROLES_KEY
 * Chave usada pelo RolesGuard para ler os roles permitidos.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles)
 *
 * Define quais perfis podem acessar uma rota.
 *
 * Exemplos:
 *   @Roles(UserRole.ADMIN)                          → só admin
 *   @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)      → admin ou biomédico
 *   @Roles(UserRole.ADMIN, UserRole.BIOMEDICO, UserRole.TECNICO) → todos
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @CurrentUser()
 *
 * Injeta o usuário logado diretamente no parâmetro do método.
 * Extrai req.user que foi preenchido pelo JwtStrategy.
 *
 * Exemplo de uso no controller:
 *   @Get('perfil')
 *   getPerfil(@CurrentUser() user: JwtPayload) {
 *     return user; // { sub, email, role, laboratorioId }
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // Se passar um campo específico: @CurrentUser('role') → retorna só o role
    return data ? user?.[data] : user;
  },
);

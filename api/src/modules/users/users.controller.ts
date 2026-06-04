import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * UsersController
 *
 * Todas as rotas exigem login (JwtAuthGuard).
 * Criação e desativação de usuários só ADMIN pode fazer.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * Cria um novo usuário no laboratório do admin logado.
   * Apenas ADMIN.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.usersService.create(createUserDto, laboratorioId);
  }

  /**
   * GET /users
   * Lista usuários do laboratório.
   * ADMIN e BIOMEDICO podem listar.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.BIOMEDICO)
  findAll(@CurrentUser('laboratorioId') laboratorioId: string) {
    return this.usersService.findAll(laboratorioId);
  }

  /**
   * PATCH /users/:id/toggle-active
   * Ativa ou desativa usuário. Apenas ADMIN.
   */
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  toggleActive(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @CurrentUser('laboratorioId') laboratorioId: string,
  ) {
    return this.usersService.toggleActive(id, active, laboratorioId);
  }
}

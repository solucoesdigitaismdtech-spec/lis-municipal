import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100)
  password: string;

  @IsEnum(UserRole, { message: 'Perfil inválido. Use: ADMIN, BIOMEDICO ou TECNICO' })
  role: UserRole;
}

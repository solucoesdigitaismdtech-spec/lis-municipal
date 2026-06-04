import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * LoginDto
 *
 * Define o formato esperado do corpo da requisição POST /auth/login.
 * O class-validator valida automaticamente antes de chegar no controller.
 * Se algum campo estiver errado, retorna 400 Bad Request automaticamente.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Informe um email válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(100, { message: 'Senha muito longa' })
  password: string;
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsEmail,
  MaxLength,
  IsObject,
  Matches,
} from 'class-validator';
import { Sexo } from '@prisma/client';

/**
 * CreatePacienteDto
 *
 * Valida os dados ao cadastrar um paciente.
 * Os campos sensíveis chegam aqui em texto puro e são
 * criptografados no service antes de salvar.
 */
export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(150)
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  cpf: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/, { message: 'CNS deve ter 15 dígitos' })
  cns?: string;

  @IsDateString({}, { message: 'Data de nascimento inválida (use AAAA-MM-DD)' })
  dataNascimento: string;

  @IsEnum(Sexo, { message: 'Sexo deve ser MASCULINO, FEMININO ou OUTRO' })
  sexo: Sexo;

  @IsString()
  @IsNotEmpty({ message: 'Unidade de saúde é obrigatória' })
  unidadeId: string;

  // ── Campos sensíveis (serão criptografados) ──

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nomeMae?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsObject()
  // Endereço como objeto: { rua, numero, bairro, cidade, uf, cep }
  endereco?: Record<string, any>;
}

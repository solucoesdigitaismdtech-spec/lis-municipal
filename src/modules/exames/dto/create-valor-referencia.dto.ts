import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Sexo } from '@prisma/client';

/**
 * CreateValorReferenciaDto
 *
 * Define uma faixa de referência para um campo do exame.
 * Ex: campo "Hemoglobina", min 12, max 16, unidade "g/dL".
 *
 * Para exames qualitativos (sem números), use textoRef.
 * Ex: campo "Resultado", textoRef "Não reagente".
 */
export class CreateValorReferenciaDto {
  @IsString()
  @IsNotEmpty({ message: 'Campo é obrigatório (ex: Hemoglobina)' })
  @MaxLength(100)
  campo: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  faixaIdade?: string; // Ex: "18+", "0-12"

  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @IsOptional()
  @IsNumber()
  minimo?: number;

  @IsOptional()
  @IsNumber()
  maximo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  textoRef?: string; // Para exames qualitativos

  @IsString()
  @IsNotEmpty({ message: 'Unidade é obrigatória (ex: g/dL)' })
  @MaxLength(30)
  unidade: string;

  @IsOptional()
  @IsBoolean()
  critico?: boolean;
}

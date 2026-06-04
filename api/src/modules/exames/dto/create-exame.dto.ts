import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { CategoriaExame } from '@prisma/client';

/**
 * CreateExameDto — valida os dados ao cadastrar um exame.
 */
export class CreateExameDto {
  @IsString()
  @IsNotEmpty({ message: 'Código do exame é obrigatório' })
  @MaxLength(50)
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do exame é obrigatório' })
  @MaxLength(150)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sigtap?: string; // Código SIGTAP/SUS

  @IsOptional()
  @IsString()
  @MaxLength(100)
  metodo?: string;

  @IsString()
  @IsNotEmpty({ message: 'Material biológico é obrigatório (ex: Sangue)' })
  @MaxLength(100)
  material: string;

  @IsEnum(CategoriaExame, {
    message: 'Categoria inválida. Ex: HEMATOLOGIA, BIOQUIMICA, URINANALISE...',
  })
  categoria: CategoriaExame;

  @IsOptional()
  @IsInt()
  @Min(1)
  prazoHoras?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instrucoes?: string; // Preparo do paciente
}

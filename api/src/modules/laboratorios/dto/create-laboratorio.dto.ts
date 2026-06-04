import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * CreateLaboratorioDto
 *
 * Valida os dados ao criar um laboratório.
 */
export class CreateLaboratorioDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do laboratório é obrigatório' })
  @MaxLength(150)
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'CNES é obrigatório' })
  @Matches(/^\d{7}$/, { message: 'CNES deve ter 7 dígitos numéricos' })
  cnes: string;

  @IsString()
  @IsNotEmpty({ message: 'Município é obrigatório' })
  @MaxLength(100)
  municipio: string;

  @IsString()
  @Length(2, 2, { message: 'UF deve ter exatamente 2 letras (ex: PB)' })
  uf: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos numéricos' })
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  responsavelTecnico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  crbm?: string;
}

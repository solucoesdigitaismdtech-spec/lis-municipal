import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { TipoUnidade } from '@prisma/client';

/**
 * CreateUnidadeDto
 *
 * Valida os dados ao criar uma unidade de saúde.
 */
export class CreateUnidadeDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da unidade é obrigatório' })
  @MaxLength(150)
  nome: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7}$/, { message: 'CNES deve ter 7 dígitos numéricos' })
  cnes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endereco?: string;

  @IsEnum(TipoUnidade, {
    message: 'Tipo inválido. Use: UBS, UPA, HOSPITAL, POSTO_SAUDE ou LABORATORIO',
  })
  tipo: TipoUnidade;
}

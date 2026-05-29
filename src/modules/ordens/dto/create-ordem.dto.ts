import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Prioridade } from '@prisma/client';

/**
 * CreateOrdemDto — valida os dados ao abrir uma ordem de serviço.
 */
export class CreateOrdemDto {
  @IsString()
  @IsNotEmpty({ message: 'Paciente é obrigatório' })
  pacienteId: string;

  @IsString()
  @IsNotEmpty({ message: 'Unidade é obrigatória' })
  unidadeId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos um exame' })
  @IsString({ each: true })
  exameIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(150)
  medicoSolicitante?: string;

  @IsOptional()
  @IsEnum(Prioridade, { message: 'Prioridade: NORMAL, URGENTE ou CRITICO' })
  prioridade?: Prioridade;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

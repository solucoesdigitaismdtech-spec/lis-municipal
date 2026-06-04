import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Prioridade } from '@prisma/client';

/**
 * CreateOrdemDto — SESSÃO 1
 * Agora com dataAgendamento (quando o paciente vem coletar).
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
  @IsDateString({}, { message: 'Data de agendamento inválida (use AAAA-MM-DD)' })
  dataAgendamento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

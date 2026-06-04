import { IsString, IsNotEmpty } from 'class-validator';

/**
 * AdicionarItemDto — valida ao adicionar um exame a uma OS existente.
 */
export class AdicionarItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Exame é obrigatório' })
  exameId: string;
}

import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DigitarResultadoDto
 *
 * O campo "valores" é um objeto livre onde a chave é o nome do
 * campo do exame e o valor é o resultado digitado.
 *
 * Exemplo para um Hemograma:
 * {
 *   "valores": {
 *     "Hemoglobina": 13.5,
 *     "Hematócrito": 41,
 *     "Leucócitos": 7500
 *   }
 * }
 *
 * O sistema compara cada valor com a referência automaticamente.
 */
export class DigitarResultadoDto {
  @IsObject({ message: 'Valores deve ser um objeto com os resultados' })
  valores: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}

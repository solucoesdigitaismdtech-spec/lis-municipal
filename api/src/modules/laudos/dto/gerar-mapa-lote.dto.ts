import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

/**
 * GerarMapaLoteDto
 *
 * Recebe a lista de IDs de ordens de serviço selecionadas
 * para gerar um único PDF de mapa de trabalho em lote.
 */
export class GerarMapaLoteDto {
  @IsArray({ message: 'ordemIds deve ser uma lista' })
  @ArrayNotEmpty({ message: 'Selecione ao menos uma ordem' })
  @IsString({ each: true, message: 'Cada ID deve ser um texto' })
  ordemIds: string[];
}

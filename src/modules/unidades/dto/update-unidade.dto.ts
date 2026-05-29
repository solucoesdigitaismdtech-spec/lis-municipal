import { PartialType } from '@nestjs/mapped-types';
import { CreateUnidadeDto } from './create-unidade.dto';

/**
 * UpdateUnidadeDto
 *
 * Torna todos os campos opcionais para atualização parcial.
 */
export class UpdateUnidadeDto extends PartialType(CreateUnidadeDto) {}

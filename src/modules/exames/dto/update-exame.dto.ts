import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateExameDto } from './create-exame.dto';

/**
 * UpdateExameDto — campos opcionais, exceto o código
 * (que é a identidade do exame no catálogo).
 */
export class UpdateExameDto extends PartialType(
  OmitType(CreateExameDto, ['codigo'] as const),
) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateLaboratorioDto } from './create-laboratorio.dto';

/**
 * UpdateLaboratorioDto
 *
 * Herda todos os campos de CreateLaboratorioDto mas torna-os
 * opcionais. Assim você pode atualizar só o que quiser
 * (ex: mudar só o responsável técnico sem reenviar tudo).
 *
 * PartialType faz essa "mágica" automaticamente.
 *
 * IMPORTANTE: precisa instalar @nestjs/mapped-types:
 *   npm install @nestjs/mapped-types
 */
export class UpdateLaboratorioDto extends PartialType(CreateLaboratorioDto) {}

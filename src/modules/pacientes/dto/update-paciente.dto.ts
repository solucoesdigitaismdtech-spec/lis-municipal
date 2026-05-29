import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePacienteDto } from './create-paciente.dto';

/**
 * UpdatePacienteDto
 *
 * Herda os campos de CreatePacienteDto como opcionais,
 * EXCETO o CPF — que não pode ser alterado depois de criado
 * (é a identidade do paciente e base do hash de busca).
 *
 * OmitType remove o cpf; PartialType torna o resto opcional.
 */
export class UpdatePacienteDto extends PartialType(
  OmitType(CreatePacienteDto, ['cpf'] as const),
) {}

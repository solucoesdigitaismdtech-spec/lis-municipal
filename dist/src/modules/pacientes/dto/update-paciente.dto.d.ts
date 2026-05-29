import { CreatePacienteDto } from './create-paciente.dto';
declare const UpdatePacienteDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreatePacienteDto, "cpf">>>;
export declare class UpdatePacienteDto extends UpdatePacienteDto_base {
}
export {};

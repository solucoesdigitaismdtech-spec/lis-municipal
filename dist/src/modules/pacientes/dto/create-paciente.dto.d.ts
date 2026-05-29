import { Sexo } from '@prisma/client';
export declare class CreatePacienteDto {
    nome: string;
    cpf: string;
    cns?: string;
    dataNascimento: string;
    sexo: Sexo;
    unidadeId: string;
    nomeMae?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    endereco?: Record<string, any>;
}

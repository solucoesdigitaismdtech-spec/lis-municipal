import { Sexo } from '@prisma/client';
export declare class CreateValorReferenciaDto {
    campo: string;
    faixaIdade?: string;
    sexo?: Sexo;
    minimo?: number;
    maximo?: number;
    textoRef?: string;
    unidade: string;
    critico?: boolean;
}

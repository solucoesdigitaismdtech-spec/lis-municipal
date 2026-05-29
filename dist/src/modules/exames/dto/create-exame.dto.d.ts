import { CategoriaExame } from '@prisma/client';
export declare class CreateExameDto {
    codigo: string;
    nome: string;
    sigtap?: string;
    metodo?: string;
    material: string;
    categoria: CategoriaExame;
    prazoHoras?: number;
    instrucoes?: string;
}

import { TipoUnidade } from '@prisma/client';
export declare class CreateUnidadeDto {
    nome: string;
    cnes?: string;
    endereco?: string;
    tipo: TipoUnidade;
}

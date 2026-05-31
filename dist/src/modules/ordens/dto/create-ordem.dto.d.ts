import { Prioridade } from '@prisma/client';
export declare class CreateOrdemDto {
    pacienteId: string;
    unidadeId: string;
    exameIds: string[];
    medicoSolicitante?: string;
    prioridade?: Prioridade;
    dataAgendamento?: string;
    observacoes?: string;
}

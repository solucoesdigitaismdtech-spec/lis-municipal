import type { Response } from 'express';
import { LaudosService } from './laudos.service';
import { LaudoPdfService } from './laudo-pdf.service';
export declare class LaudosController {
    private readonly laudosService;
    private readonly laudoPdfService;
    constructor(laudosService: LaudosService, laudoPdfService: LaudoPdfService);
    listar(laboratorioId: string): Promise<({
        paciente: {
            nome: string;
        };
        unidade: {
            nome: string;
        };
        laudo: {
            id: string;
            status: import("@prisma/client").$Enums.StatusLaudo;
            hashAutenticacao: string;
            liberadoEm: Date | null;
        } | null;
        _count: {
            itens: number;
        };
    } & {
        laboratorioId: string;
        id: string;
        protocolo: string;
        pacienteId: string;
        unidadeId: string;
        solicitanteId: string;
        medicoSolicitante: string | null;
        status: import("@prisma/client").$Enums.StatusOS;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        dataColeta: Date | null;
        dataAgendamento: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    dados(ordemId: string, laboratorioId: string): Promise<{
        laboratorio: {
            nome: string;
            cnes: string;
            municipio: string;
            uf: string;
            responsavelTecnico: string | null;
            crbm: string | null;
            logoUrl: string | null;
        };
        paciente: {
            nome: string;
            dataNascimento: Date;
            sexo: import("@prisma/client").$Enums.Sexo;
        };
        unidade: {
            nome: string;
        };
        itens: ({
            exame: {
                valoresRef: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    unidade: string;
                    sexo: import("@prisma/client").$Enums.Sexo | null;
                    exameId: string;
                    campo: string;
                    faixaIdade: string | null;
                    minimo: number | null;
                    maximo: number | null;
                    textoRef: string | null;
                    critico: boolean;
                }[];
            } & {
                laboratorioId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                nome: string;
                ativo: boolean;
                codigo: string;
                sigtap: string | null;
                metodo: string | null;
                material: string;
                categoria: import("@prisma/client").$Enums.CategoriaExame;
                prazoHoras: number;
                instrucoes: string | null;
            };
            resultado: ({
                biomedico: {
                    name: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.StatusResult;
                createdAt: Date;
                updatedAt: Date;
                critico: boolean;
                itemOrdemId: string;
                biomedicoId: string;
                valores: import("@prisma/client/runtime/client").JsonValue;
                observacao: string | null;
                parecerTecnico: string | null;
                assinadoEm: Date | null;
                validadoEm: Date | null;
            }) | null;
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StatusItem;
            createdAt: Date;
            updatedAt: Date;
            ordemId: string;
            exameId: string;
            coletadoEm: Date | null;
            prazoEntrega: Date | null;
        })[];
        laudo: {
            id: string;
            status: import("@prisma/client").$Enums.StatusLaudo;
            createdAt: Date;
            updatedAt: Date;
            ordemId: string;
            hashAutenticacao: string;
            urlPdf: string | null;
            qrCodeUrl: string | null;
            liberadoEm: Date | null;
            expiracaoUrl: Date | null;
        } | null;
    } & {
        laboratorioId: string;
        id: string;
        protocolo: string;
        pacienteId: string;
        unidadeId: string;
        solicitanteId: string;
        medicoSolicitante: string | null;
        status: import("@prisma/client").$Enums.StatusOS;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        dataColeta: Date | null;
        dataAgendamento: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    gerar(ordemId: string, laboratorioId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.StatusLaudo;
        createdAt: Date;
        updatedAt: Date;
        ordemId: string;
        hashAutenticacao: string;
        urlPdf: string | null;
        qrCodeUrl: string | null;
        liberadoEm: Date | null;
        expiracaoUrl: Date | null;
    } | null>;
    pdf(ordemId: string, laboratorioId: string, res: Response): Promise<void>;
}

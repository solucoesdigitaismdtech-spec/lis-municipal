import { PrismaService } from '../../prisma/prisma.service';
export declare class LaudosService {
    private prisma;
    private readonly logger;
    private readonly urlBaseVerificacao;
    constructor(prisma: PrismaService);
    listar(laboratorioId: string): Promise<({
        _count: {
            itens: number;
        };
        unidade: {
            nome: string;
        };
        paciente: {
            nome: string;
        };
        laudo: {
            id: string;
            status: import("@prisma/client").$Enums.StatusLaudo;
            hashAutenticacao: string;
            liberadoEm: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        unidadeId: string;
        pacienteId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        dataAgendamento: Date | null;
        observacoes: string | null;
        protocolo: string;
        status: import("@prisma/client").$Enums.StatusOS;
        dataColeta: Date | null;
        solicitanteId: string;
    })[]>;
    gerar(ordemId: string, laboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.StatusLaudo;
        ordemId: string;
        hashAutenticacao: string;
        urlPdf: string | null;
        qrCodeUrl: string | null;
        liberadoEm: Date | null;
        expiracaoUrl: Date | null;
    } | null>;
    dadosLaudo(ordemId: string, laboratorioId: string): Promise<{
        laboratorio: {
            cnes: string;
            nome: string;
            municipio: string;
            uf: string;
            responsavelTecnico: string | null;
            crbm: string | null;
            logoUrl: string | null;
        };
        unidade: {
            nome: string;
        };
        paciente: {
            sexo: import("@prisma/client").$Enums.Sexo;
            nome: string;
            dataNascimento: Date;
        };
        laudo: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.StatusLaudo;
            ordemId: string;
            hashAutenticacao: string;
            urlPdf: string | null;
            qrCodeUrl: string | null;
            liberadoEm: Date | null;
            expiracaoUrl: Date | null;
        } | null;
        itens: ({
            exame: {
                valoresRef: {
                    sexo: import("@prisma/client").$Enums.Sexo | null;
                    textoRef: string | null;
                    minimo: number | null;
                    critico: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    campo: string;
                    faixaIdade: string | null;
                    maximo: number | null;
                    unidade: string;
                    exameId: string;
                }[];
            } & {
                instrucoes: string | null;
                id: string;
                nome: string;
                ativo: boolean;
                createdAt: Date;
                updatedAt: Date;
                codigo: string;
                sigtap: string | null;
                material: string;
                categoria: import("@prisma/client").$Enums.CategoriaExame;
                metodo: string | null;
                prazoHoras: number;
                laboratorioId: string;
            };
            resultado: ({
                biomedico: {
                    name: string;
                };
            } & {
                critico: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                valores: import("@prisma/client/runtime/client").JsonValue;
                status: import("@prisma/client").$Enums.StatusResult;
                observacao: string | null;
                itemOrdemId: string;
                biomedicoId: string;
                parecerTecnico: string | null;
                assinadoEm: Date | null;
                validadoEm: Date | null;
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            exameId: string;
            status: import("@prisma/client").$Enums.StatusItem;
            coletadoEm: Date | null;
            prazoEntrega: Date | null;
            ordemId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        unidadeId: string;
        pacienteId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        dataAgendamento: Date | null;
        observacoes: string | null;
        protocolo: string;
        status: import("@prisma/client").$Enums.StatusOS;
        dataColeta: Date | null;
        solicitanteId: string;
    }>;
    verificar(hash: string): Promise<{
        valido: boolean;
        mensagem: string;
        protocolo?: undefined;
        paciente?: undefined;
        laboratorio?: undefined;
        municipio?: undefined;
        emitidoEm?: undefined;
        status?: undefined;
    } | {
        valido: boolean;
        protocolo: string;
        paciente: string;
        laboratorio: string;
        municipio: string;
        emitidoEm: Date | null;
        status: import("@prisma/client").$Enums.StatusLaudo;
        mensagem?: undefined;
    }>;
}

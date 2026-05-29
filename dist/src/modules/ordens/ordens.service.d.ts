import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrdemDto } from './dto/create-ordem.dto';
export declare class OrdensService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateOrdemDto, laboratorioId: string, solicitanteId: string): Promise<{
        itens: ({
            exame: {
                nome: string;
                codigo: string;
            };
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
        pacienteId: string;
        unidadeId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        protocolo: string;
        status: import("@prisma/client").$Enums.StatusOS;
        dataColeta: Date | null;
        solicitanteId: string;
    }>;
    findAll(laboratorioId: string, filtros: {
        status?: string;
        pagina?: number;
        limite?: number;
    }): Promise<{
        dados: ({
            _count: {
                itens: number;
            };
            unidade: {
                id: string;
                nome: string;
            };
            paciente: {
                id: string;
                nome: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            laboratorioId: string;
            pacienteId: string;
            unidadeId: string;
            medicoSolicitante: string | null;
            prioridade: import("@prisma/client").$Enums.Prioridade;
            observacoes: string | null;
            protocolo: string;
            status: import("@prisma/client").$Enums.StatusOS;
            dataColeta: Date | null;
            solicitanteId: string;
        })[];
        paginacao: {
            pagina: number;
            limite: number;
            total: number;
            totalPaginas: number;
        };
    }>;
    findOne(id: string, laboratorioId: string): Promise<{
        unidade: {
            id: string;
            nome: string;
        };
        paciente: {
            id: string;
            nome: string;
        };
        solicitante: {
            id: string;
            name: string;
        };
        itens: ({
            exame: {
                nome: string;
                codigo: string;
                material: string;
            };
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
        pacienteId: string;
        unidadeId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        protocolo: string;
        status: import("@prisma/client").$Enums.StatusOS;
        dataColeta: Date | null;
        solicitanteId: string;
    }>;
    registrarColeta(ordemId: string, itemId: string, laboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        exameId: string;
        status: import("@prisma/client").$Enums.StatusItem;
        coletadoEm: Date | null;
        prazoEntrega: Date | null;
        ordemId: string;
    }>;
    cancelar(id: string, laboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        pacienteId: string;
        unidadeId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        protocolo: string;
        status: import("@prisma/client").$Enums.StatusOS;
        dataColeta: Date | null;
        solicitanteId: string;
    }>;
    private gerarProtocolo;
    private atualizarStatusOrdem;
}

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
            ordemId: string;
            exameId: string;
            status: import("@prisma/client").$Enums.StatusItem;
            coletadoEm: Date | null;
            prazoEntrega: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        status: import("@prisma/client").$Enums.StatusOS;
        protocolo: string;
        pacienteId: string;
        unidadeId: string;
        solicitanteId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        dataColeta: Date | null;
        dataAgendamento: Date | null;
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
            status: import("@prisma/client").$Enums.StatusOS;
            protocolo: string;
            pacienteId: string;
            unidadeId: string;
            solicitanteId: string;
            medicoSolicitante: string | null;
            prioridade: import("@prisma/client").$Enums.Prioridade;
            observacoes: string | null;
            dataColeta: Date | null;
            dataAgendamento: Date | null;
        })[];
        paginacao: {
            pagina: number;
            limite: number;
            total: number;
            totalPaginas: number;
        };
    }>;
    agendaDoDia(laboratorioId: string, data?: string): Promise<{
        data: string;
        total: number;
        ordens: ({
            _count: {
                itens: number;
            };
            unidade: {
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
            status: import("@prisma/client").$Enums.StatusOS;
            protocolo: string;
            pacienteId: string;
            unidadeId: string;
            solicitanteId: string;
            medicoSolicitante: string | null;
            prioridade: import("@prisma/client").$Enums.Prioridade;
            observacoes: string | null;
            dataColeta: Date | null;
            dataAgendamento: Date | null;
        })[];
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
            ordemId: string;
            exameId: string;
            status: import("@prisma/client").$Enums.StatusItem;
            coletadoEm: Date | null;
            prazoEntrega: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        status: import("@prisma/client").$Enums.StatusOS;
        protocolo: string;
        pacienteId: string;
        unidadeId: string;
        solicitanteId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        dataColeta: Date | null;
        dataAgendamento: Date | null;
    }>;
    registrarColeta(ordemId: string, itemId: string, laboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ordemId: string;
        exameId: string;
        status: import("@prisma/client").$Enums.StatusItem;
        coletadoEm: Date | null;
        prazoEntrega: Date | null;
    }>;
    registrarColetaCompleta(ordemId: string, laboratorioId: string): Promise<{
        message: string;
    }>;
    cancelar(id: string, laboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        status: import("@prisma/client").$Enums.StatusOS;
        protocolo: string;
        pacienteId: string;
        unidadeId: string;
        solicitanteId: string;
        medicoSolicitante: string | null;
        prioridade: import("@prisma/client").$Enums.Prioridade;
        observacoes: string | null;
        dataColeta: Date | null;
        dataAgendamento: Date | null;
    }>;
    private gerarProtocolo;
    private atualizarStatusOrdem;
}

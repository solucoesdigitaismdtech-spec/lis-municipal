import { OrdensService } from './ordens.service';
import { CreateOrdemDto } from './dto/create-ordem.dto';
export declare class OrdensController {
    private readonly ordensService;
    constructor(ordensService: OrdensService);
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
    findAll(laboratorioId: string, status?: string, pagina?: string, limite?: string): Promise<{
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
}

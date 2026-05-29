import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
export declare class UnidadesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateUnidadeDto, laboratorioId: string): Promise<{
        id: string;
        laboratorioId: string;
        ativa: boolean;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        endereco: string | null;
        cnes: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
    }>;
    findAll(laboratorioId: string): Promise<({
        _count: {
            ordens: number;
            pacientes: number;
        };
    } & {
        id: string;
        laboratorioId: string;
        ativa: boolean;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        endereco: string | null;
        cnes: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
    })[]>;
    findOne(id: string, laboratorioId: string): Promise<{
        id: string;
        laboratorioId: string;
        ativa: boolean;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        endereco: string | null;
        cnes: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
    }>;
    update(id: string, dto: UpdateUnidadeDto, laboratorioId: string): Promise<{
        id: string;
        laboratorioId: string;
        ativa: boolean;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        endereco: string | null;
        cnes: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
    }>;
    toggleActive(id: string, ativa: boolean, laboratorioId: string): Promise<{
        id: string;
        ativa: boolean;
        nome: string;
    }>;
}

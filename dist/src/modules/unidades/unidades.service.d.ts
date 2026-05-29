import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
export declare class UnidadesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateUnidadeDto, laboratorioId: string): Promise<{
        id: string;
        cnes: string | null;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        endereco: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
        ativa: boolean;
    }>;
    findAll(laboratorioId: string): Promise<({
        _count: {
            pacientes: number;
            ordens: number;
        };
    } & {
        id: string;
        cnes: string | null;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        endereco: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
        ativa: boolean;
    })[]>;
    findOne(id: string, laboratorioId: string): Promise<{
        id: string;
        cnes: string | null;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        endereco: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
        ativa: boolean;
    }>;
    update(id: string, dto: UpdateUnidadeDto, laboratorioId: string): Promise<{
        id: string;
        cnes: string | null;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        laboratorioId: string;
        endereco: string | null;
        tipo: import("@prisma/client").$Enums.TipoUnidade;
        ativa: boolean;
    }>;
    toggleActive(id: string, ativa: boolean, laboratorioId: string): Promise<{
        id: string;
        nome: string;
        ativa: boolean;
    }>;
}

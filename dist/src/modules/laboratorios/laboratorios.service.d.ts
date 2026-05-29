import { PrismaService } from '../../prisma/prisma.service';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';
export declare class LaboratoriosService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateLaboratorioDto): Promise<{
        id: string;
        cnes: string;
        nome: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        _count: {
            users: number;
            unidades: number;
            pacientes: number;
        };
    } & {
        id: string;
        cnes: string;
        nome: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            users: number;
            unidades: number;
            pacientes: number;
            ordens: number;
        };
    } & {
        id: string;
        cnes: string;
        nome: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateLaboratorioDto): Promise<{
        id: string;
        cnes: string;
        nome: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleActive(id: string, ativo: boolean): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
    }>;
}

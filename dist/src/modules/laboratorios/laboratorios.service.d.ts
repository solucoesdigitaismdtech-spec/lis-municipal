import { PrismaService } from '../../prisma/prisma.service';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';
export declare class LaboratoriosService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateLaboratorioDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        ativo: boolean;
        cnes: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
    }>;
    findAll(): Promise<({
        _count: {
            pacientes: number;
            users: number;
            unidades: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        ativo: boolean;
        cnes: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            ordens: number;
            pacientes: number;
            users: number;
            unidades: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        ativo: boolean;
        cnes: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
    }>;
    update(id: string, dto: UpdateLaboratorioDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        ativo: boolean;
        cnes: string;
        municipio: string;
        uf: string;
        cnpj: string | null;
        responsavelTecnico: string | null;
        crbm: string | null;
        logoUrl: string | null;
    }>;
    toggleActive(id: string, ativo: boolean): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
    }>;
}

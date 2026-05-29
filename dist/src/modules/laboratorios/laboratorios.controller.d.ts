import { LaboratoriosService } from './laboratorios.service';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';
export declare class LaboratoriosController {
    private readonly laboratoriosService;
    constructor(laboratoriosService: LaboratoriosService);
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
    findMeu(laboratorioId: string): Promise<{
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

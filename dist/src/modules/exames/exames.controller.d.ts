import { ExamesService } from './exames.service';
import { CreateExameDto } from './dto/create-exame.dto';
import { UpdateExameDto } from './dto/update-exame.dto';
import { CreateValorReferenciaDto } from './dto/create-valor-referencia.dto';
export declare class ExamesController {
    private readonly examesService;
    constructor(examesService: ExamesService);
    create(dto: CreateExameDto, laboratorioId: string): Promise<{
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
    }>;
    findAll(laboratorioId: string, categoria?: string, busca?: string): Promise<({
        _count: {
            valoresRef: number;
        };
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
    })[]>;
    findOne(id: string, laboratorioId: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateExameDto, laboratorioId: string): Promise<{
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
    }>;
    remove(id: string, laboratorioId: string): Promise<{
        message: string;
    }>;
    addValorReferencia(exameId: string, dto: CreateValorReferenciaDto, laboratorioId: string): Promise<{
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
    }>;
    removeValorReferencia(exameId: string, valorId: string, laboratorioId: string): Promise<{
        message: string;
    }>;
}

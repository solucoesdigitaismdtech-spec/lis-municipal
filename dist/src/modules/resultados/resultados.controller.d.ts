import { ResultadosService } from './resultados.service';
import { DigitarResultadoDto } from './dto/digitar-resultado.dto';
export declare class ResultadosController {
    private readonly resultadosService;
    constructor(resultadosService: ResultadosService);
    listarPendentes(laboratorioId: string): Promise<({
        exame: {
            nome: string;
            codigo: string;
            material: string;
        };
        resultado: {
            status: import("@prisma/client").$Enums.StatusResult;
        } | null;
        ordem: {
            paciente: {
                nome: string;
            };
            prioridade: import("@prisma/client").$Enums.Prioridade;
            protocolo: string;
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
    })[]>;
    listarAguardandoValidacao(laboratorioId: string): Promise<({
        exame: {
            nome: string;
            codigo: string;
        };
        resultado: {
            critico: boolean;
            valores: import("@prisma/client/runtime/client").JsonValue;
            status: import("@prisma/client").$Enums.StatusResult;
        } | null;
        ordem: {
            paciente: {
                nome: string;
            };
            prioridade: import("@prisma/client").$Enums.Prioridade;
            protocolo: string;
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
    })[]>;
    digitar(itemOrdemId: string, dto: DigitarResultadoDto, laboratorioId: string, usuarioId: string): Promise<{
        alertaCritico: string | null;
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
    }>;
    validar(itemOrdemId: string, laboratorioId: string): Promise<{
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
    }>;
    assinar(itemOrdemId: string, parecerTecnico: string, laboratorioId: string): Promise<{
        itemOrdem: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            exameId: string;
            status: import("@prisma/client").$Enums.StatusItem;
            coletadoEm: Date | null;
            prazoEntrega: Date | null;
            ordemId: string;
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
    }>;
}

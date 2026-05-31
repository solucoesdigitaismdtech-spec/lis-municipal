import type { Response } from 'express';
import { LaudosService } from './laudos.service';
export declare class LaudosController {
    private readonly laudosService;
    constructor(laudosService: LaudosService);
    validarPublico(hash: string): Promise<{
        valido: boolean;
        mensagem: string;
        protocolo?: undefined;
        paciente?: undefined;
        laboratorio?: undefined;
        municipio?: undefined;
        emitidoEm?: undefined;
    } | {
        valido: boolean;
        protocolo: string;
        paciente: string;
        laboratorio: string;
        municipio: string;
        emitidoEm: Date | null;
        mensagem: string;
    }>;
    gerar(ordemId: string, laboratorioId: string): Promise<{
        id: string;
        protocolo: string;
        hashAutenticacao: string;
        urlPdf: string | null;
        urlValidacao: string;
        status: import("@prisma/client").$Enums.StatusLaudo;
    }>;
    download(ordemId: string, laboratorioId: string, res: Response): Promise<void>;
}

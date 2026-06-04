import { LaudosService } from './laudos.service';
export declare class LaudosPublicoController {
    private readonly laudosService;
    constructor(laudosService: LaudosService);
    verificar(hash: string): Promise<{
        valido: boolean;
        mensagem: string;
        protocolo?: undefined;
        paciente?: undefined;
        laboratorio?: undefined;
        municipio?: undefined;
        emitidoEm?: undefined;
        status?: undefined;
    } | {
        valido: boolean;
        protocolo: string;
        paciente: string;
        laboratorio: string;
        municipio: string;
        emitidoEm: Date | null;
        status: import("@prisma/client").$Enums.StatusLaudo;
        mensagem?: undefined;
    }>;
}

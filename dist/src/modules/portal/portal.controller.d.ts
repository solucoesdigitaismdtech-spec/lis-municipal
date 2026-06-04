import { PortalService } from './portal.service';
export declare class PortalController {
    private readonly portalService;
    constructor(portalService: PortalService);
    consultar(protocolo: string, nascimento: string): Promise<{
        protocolo: string;
        paciente: string;
        laboratorio: string;
        municipio: string;
        statusGeral: string;
        exames: {
            nome: string;
            status: string;
            pronto: boolean;
        }[];
        laudoPronto: boolean;
        hashLaudo: string | null | undefined;
    }>;
}

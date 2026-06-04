import { PrismaService } from '../../prisma/prisma.service';
export declare class PortalService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    consultar(protocolo: string, dataNascimento: string): Promise<{
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
    private traduzirStatusItem;
    private traduzirStatusOrdem;
    private mascaraNome;
}

import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
export declare class LaudosService {
    private prisma;
    private crypto;
    private config;
    private readonly logger;
    private readonly laudosDir;
    private readonly apiUrl;
    constructor(prisma: PrismaService, crypto: CryptoService, config: ConfigService);
    gerarLaudo(ordemId: string, laboratorioId: string): Promise<{
        id: string;
        protocolo: string;
        hashAutenticacao: string;
        urlPdf: string | null;
        urlValidacao: string;
        status: import("@prisma/client").$Enums.StatusLaudo;
    }>;
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
    obterCaminhoPdf(ordemId: string, laboratorioId: string): Promise<string>;
    private montarPdf;
    private mascaraNome;
}

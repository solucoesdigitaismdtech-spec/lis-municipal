import { PrismaService } from '../../prisma/prisma.service';
export declare class MapaTrabalhoService {
    private prisma;
    private readonly logger;
    private readonly mapasDir;
    constructor(prisma: PrismaService);
    gerarMapaPorOrdem(ordemId: string, laboratorioId: string): Promise<string>;
    gerarMapaDoDia(laboratorioId: string, data?: string): Promise<string>;
    private montarPdf;
    private calcularIdade;
}

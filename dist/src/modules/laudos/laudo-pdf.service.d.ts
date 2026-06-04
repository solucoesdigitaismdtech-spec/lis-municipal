import { OnModuleDestroy } from '@nestjs/common';
export declare class LaudoPdfService implements OnModuleDestroy {
    private readonly logger;
    private browser;
    private obterBrowser;
    gerarPdf(ordem: any): Promise<Buffer>;
    onModuleDestroy(): Promise<void>;
}

import { OnModuleDestroy } from '@nestjs/common';
export declare class PdfGeneratorService implements OnModuleDestroy {
    private readonly logger;
    private browser;
    private getBrowser;
    gerarPdfDeHtml(html: string): Promise<Buffer>;
    onModuleDestroy(): Promise<void>;
}

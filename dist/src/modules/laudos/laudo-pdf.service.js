"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LaudoPdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaudoPdfService = void 0;
const common_1 = require("@nestjs/common");
const laudo_html_template_1 = require("./laudo-html.template");
let LaudoPdfService = LaudoPdfService_1 = class LaudoPdfService {
    logger = new common_1.Logger(LaudoPdfService_1.name);
    browser = null;
    async obterBrowser() {
        if (this.browser && this.browser.connected) {
            return this.browser;
        }
        const puppeteer = await import('puppeteer');
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
        this.logger.log('Chromium iniciado para geração de PDF');
        return this.browser;
    }
    async gerarPdf(ordem) {
        const html = (0, laudo_html_template_1.montarLaudoHtml)(ordem);
        const browser = await this.obterBrowser();
        const page = await browser.newPage();
        try {
            await page.setContent(html, { waitUntil: 'load' });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0', bottom: '0', left: '0', right: '0' },
            });
            return Buffer.from(pdf);
        }
        finally {
            await page.close();
        }
    }
    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
            this.logger.log('Chromium encerrado');
        }
    }
};
exports.LaudoPdfService = LaudoPdfService;
exports.LaudoPdfService = LaudoPdfService = LaudoPdfService_1 = __decorate([
    (0, common_1.Injectable)()
], LaudoPdfService);
//# sourceMappingURL=laudo-pdf.service.js.map
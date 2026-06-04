import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

/**
 * PdfGeneratorService
 *
 * Serviço genérico que converte HTML em PDF usando o Puppeteer
 * (um navegador Chrome "sem tela" que renderiza o HTML e imprime
 * em PDF, exatamente como apareceria no navegador).
 *
 * Vantagem sobre o pdfkit: podemos usar HTML + CSS completos,
 * o que permite layouts profissionais, tabelas, cores, logos —
 * tudo muito mais fácil de personalizar.
 *
 * Otimização: reutilizamos a mesma instância do navegador entre
 * gerações (em vez de abrir um novo a cada PDF), o que é muito
 * mais rápido. O navegador é fechado quando a aplicação encerra.
 */
@Injectable()
export class PdfGeneratorService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: Browser | null = null;

  /**
   * Obtém (ou cria) a instância do navegador.
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.logger.log('Iniciando navegador Puppeteer...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Converte uma string HTML em um Buffer de PDF.
   *
   * @param html — o HTML completo (com CSS inline ou em <style>)
   * @returns Buffer do PDF gerado
   */
  async gerarPdfDeHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Carrega o HTML e espera a renderização
      await page.setContent(html, { waitUntil: 'load' });

      // Gera o PDF em formato A4 com margens
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // importante para cores de fundo
        margin: {
          top: '15mm',
          bottom: '15mm',
          left: '12mm',
          right: '12mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      // Fecha apenas a aba (mantém o navegador aberto para reuso)
      await page.close();
    }
  }

  /**
   * Fecha o navegador quando a aplicação encerra.
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Navegador Puppeteer encerrado');
    }
  }
}

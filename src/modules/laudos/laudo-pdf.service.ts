import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Browser } from 'puppeteer';
import { montarLaudoHtml } from './laudo-html.template';

/**
 * LaudoPdfService
 *
 * Converte o HTML do laudo em PDF usando o Puppeteer (Chromium headless).
 *
 * O browser é reaproveitado entre requisições (lançado uma vez e mantido
 * vivo) para performance — abrir um Chromium a cada laudo seria lento.
 * Ele é fechado quando o módulo é destruído.
 *
 * IMPORTANTE (deploy Linux): o Chromium precisa de bibliotecas de sistema.
 * Em produção, defina a variável PUPPETEER_EXECUTABLE_PATH apontando para
 * o Chromium instalado, ou instale as libs (ver guia de deploy).
 */
@Injectable()
export class LaudoPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(LaudoPdfService.name);
  private browser: Browser | null = null;

  /**
   * Lança (ou reaproveita) a instância do Chromium.
   */
  private async obterBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    // Import dinâmico para não travar o boot da app se o Chromium não estiver pronto
    const puppeteer = await import('puppeteer');

    this.browser = await puppeteer.launch({
      headless: true,
      // Caminho customizado do Chromium em produção (opcional)
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // evita travar em containers/VPS com pouca /dev/shm
        '--disable-gpu',
      ],
    });

    this.logger.log('Chromium iniciado para geração de PDF');
    return this.browser;
  }

  /**
   * Gera o PDF do laudo a partir da OS completa.
   * Retorna um Buffer pronto para enviar como resposta HTTP.
   */
  async gerarPdf(ordem: any): Promise<Buffer> {
    const html = montarLaudoHtml(ordem);
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
    } finally {
      await page.close(); // fecha só a aba, mantém o browser vivo
    }
  }

  /**
   * Fecha o Chromium ao desligar a aplicação.
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Chromium encerrado');
    }
  }
}

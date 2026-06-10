import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { montarComprovanteHtml } from './comprovante-html.template';
import * as QRCode from 'qrcode';

/**
 * ComprovanteService
 *
 * Gera o PDF do comprovante de atendimento (com QR code) entregue ao
 * paciente quando a OS é criada. O QR leva ao Portal do Paciente já
 * com o protocolo, bastando o paciente informar a data de nascimento.
 */
@Injectable()
export class ComprovanteService {
  private readonly logger = new Logger(ComprovanteService.name);

  // Base do portal público. Em produção, defina URL_PORTAL no .env
  // ex: https://laboratorio.suacidade.gov.br
  private readonly urlBasePortal =
    process.env.URL_PORTAL || 'http://localhost:3000';

  constructor(private prisma: PrismaService) {}

  /**
   * Gera o PDF do comprovante de uma OS e retorna o Buffer.
   */
  async gerarComprovantePdf(ordemId: string, laboratorioId: string): Promise<{ pdf: Buffer; protocolo: string }> {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, laboratorioId },
      include: {
        laboratorio: { select: { nome: true, municipio: true, uf: true } },
        paciente: { select: { nome: true, dataNascimento: true } },
        unidade: { select: { nome: true } },
        itens: { include: { exame: { select: { nome: true } } } },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // URL do portal com o protocolo já preenchido
    const urlPortalProtocolo = `${this.urlBasePortal}/portal?protocolo=${encodeURIComponent(ordem.protocolo)}`;

    // Gera o QR code como data URL (mesma lib usada nos laudos)
    let qrCodeUrl: string | null = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(urlPortalProtocolo, { width: 240, margin: 1 });
    } catch (e) {
      this.logger.warn(`Falha ao gerar QR do comprovante: ${e}`);
    }

    const html = montarComprovanteHtml({
      protocolo: ordem.protocolo,
      paciente: ordem.paciente?.nome || '—',
      laboratorio: ordem.laboratorio?.nome || 'Laboratório',
      municipio: `${ordem.laboratorio?.municipio || ''}/${ordem.laboratorio?.uf || ''}`,
      unidade: ordem.unidade?.nome,
      exames: ordem.itens.map((i) => i.exame?.nome).filter(Boolean) as string[],
      criadoEm: new Date(ordem.createdAt).toLocaleDateString('pt-BR'),
      qrCodeUrl,
      urlPortal: `${this.urlBasePortal}/portal`,
    });

    const pdf = await this.htmlParaPdf(html);
    this.logger.log(`Comprovante gerado: OS ${ordem.protocolo}`);
    return { pdf, protocolo: ordem.protocolo };
  }

  /**
   * Converte HTML em PDF via Puppeteer.
   */
  private async htmlParaPdf(html: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      await page.close();
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

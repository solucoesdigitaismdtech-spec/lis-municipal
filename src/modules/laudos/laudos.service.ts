import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusItem, StatusLaudo, StatusResult } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';

/**
 * LaudosService
 *
 * Gera e gerencia os laudos (documento final dos exames).
 *
 * Um laudo só pode ser gerado quando TODOS os exames da OS estão
 * validados pelo biomédico. Cada laudo recebe um hash de autenticação
 * único e um QR code que aponta para a página pública de verificação.
 */
@Injectable()
export class LaudosService {
  private readonly logger = new Logger(LaudosService.name);

  // URL base pública para verificação (ajuste via .env em produção)
  private readonly urlBaseVerificacao =
    process.env.URL_VERIFICACAO_LAUDO || 'http://localhost:3000/verificar';

  constructor(private prisma: PrismaService) {}

  /**
   * Lista as ordens prontas para laudo e os laudos já gerados.
   * Aceita tanto LIBERADA (fluxo de assinatura) quanto CONCLUIDA.
   */
  async listar(laboratorioId: string) {
    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        laboratorioId,
        status: { in: ['LIBERADA', 'CONCLUIDA'] as any },
      },
      include: {
        paciente: { select: { nome: true } },
        unidade: { select: { nome: true } },
        laudo: { select: { id: true, status: true, liberadoEm: true, hashAutenticacao: true } },
        _count: { select: { itens: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return ordens;
  }

  /**
   * Gera o laudo de uma OS (ou retorna o existente).
   *
   * Regra: todos os itens da OS precisam estar VALIDADOS.
   */
  async gerar(ordemId: string, laboratorioId: string) {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, laboratorioId },
      include: { itens: true, laudo: true },
    });
    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // Valida que todos os itens estão validados
    const todosValidados = ordem.itens.every(
      (i) => i.status === StatusItem.VALIDADO || i.status === StatusItem.LIBERADO,
    );
    if (!todosValidados) {
      throw new BadRequestException(
        'Todos os exames precisam estar validados antes de gerar o laudo',
      );
    }

    // Se já existe laudo, retorna ele (idempotente)
    if (ordem.laudo) {
      return this.prisma.laudo.findUnique({ where: { id: ordem.laudo.id } });
    }

    // Gera hash de autenticação único (32 caracteres hex)
    const hashAutenticacao = randomBytes(16).toString('hex');
    const urlVerificacao = `${this.urlBaseVerificacao}/${hashAutenticacao}`;

    // Gera o QR code como data URI (embutido, não precisa de storage)
    let qrCodeUrl: string | null = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(urlVerificacao, { width: 200, margin: 1 });
    } catch (e) {
      this.logger.warn(`Falha ao gerar QR code: ${e}`);
    }

    const laudo = await this.prisma.laudo.create({
      data: {
        ordemId,
        hashAutenticacao,
        qrCodeUrl,
        status: StatusLaudo.LIBERADO,
        liberadoEm: new Date(),
      },
    });

    // Marca os itens como LIBERADO
    await this.prisma.itemOrdem.updateMany({
      where: { ordemId, status: StatusItem.VALIDADO },
      data: { status: StatusItem.LIBERADO },
    });

    this.logger.log(`Laudo gerado: OS ${ordem.protocolo} — hash ${hashAutenticacao}`);
    return laudo;
  }

  /**
   * Retorna todos os dados necessários para renderizar o laudo:
   * laboratório, paciente, exames com resultados e valores de referência,
   * e o biomédico que assinou.
   */
  async dadosLaudo(ordemId: string, laboratorioId: string) {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, laboratorioId },
      include: {
        laboratorio: {
          select: {
            nome: true, cnes: true, municipio: true, uf: true,
            responsavelTecnico: true, crbm: true, logoUrl: true,
          },
        },
        paciente: { select: { nome: true, dataNascimento: true, sexo: true } },
        unidade: { select: { nome: true } },
        laudo: true,
        itens: {
          include: {
            exame: { include: { valoresRef: true } },
            resultado: {
              include: { biomedico: { select: { name: true } } },
            },
          },
        },
      },
    });
    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }
    return ordem;
  }

  /**
   * Verificação PÚBLICA de autenticidade por hash.
   * Retorna apenas dados mínimos (sem expor informação sensível do paciente).
   */
  async verificar(hash: string) {
    const laudo = await this.prisma.laudo.findUnique({
      where: { hashAutenticacao: hash },
      include: {
        ordem: {
          select: {
            protocolo: true,
            createdAt: true,
            laboratorio: { select: { nome: true, municipio: true, uf: true } },
            paciente: { select: { nome: true } },
          },
        },
      },
    });

    if (!laudo) {
      return { valido: false, mensagem: 'Laudo não encontrado ou hash inválido' };
    }

    // Mascara o nome do paciente (LGPD): primeiro nome + iniciais
    const nomeCompleto = laudo.ordem.paciente?.nome || '';
    const partes = nomeCompleto.split(' ');
    const nomeMascarado = partes.length > 1
      ? `${partes[0]} ${partes.slice(1).map((p) => p[0] + '.').join(' ')}`
      : partes[0];

    return {
      valido: true,
      protocolo: laudo.ordem.protocolo,
      paciente: nomeMascarado,
      laboratorio: laudo.ordem.laboratorio?.nome,
      municipio: `${laudo.ordem.laboratorio?.municipio}/${laudo.ordem.laboratorio?.uf}`,
      emitidoEm: laudo.liberadoEm,
      status: laudo.status,
    };
  }
}

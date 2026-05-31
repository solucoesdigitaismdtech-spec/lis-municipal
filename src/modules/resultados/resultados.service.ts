import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DigitarResultadoDto } from './dto/digitar-resultado.dto';
import { StatusResult, StatusItem, StatusOS } from '@prisma/client';

/**
 * ResultadosService
 *
 * Gerencia a digitação e validação de resultados pelos biomédicos.
 *
 * Fluxo do resultado:
 *   RASCUNHO → DIGITADO → VALIDADO → ASSINADO
 *
 * Ao ASSINAR, o item da ordem vira LIBERADO e, se todos os itens
 * estiverem liberados, dispara a geração do laudo.
 *
 * Os valores digitados são automaticamente comparados com os
 * valores de referência do exame para destacar resultados
 * fora da faixa e marcar resultados críticos.
 */
@Injectable()
export class ResultadosService {
  private readonly logger = new Logger(ResultadosService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Lista os itens pendentes de digitação (fila do biomédico).
   * Mostra exames já coletados que ainda não têm resultado assinado.
   */
  async listarPendentes(laboratorioId: string) {
    const itens = await this.prisma.itemOrdem.findMany({
      where: {
        ordem: { laboratorioId },
        status: { in: [StatusItem.COLETADO, StatusItem.EM_ANALISE, StatusItem.RESULTADO_DIGITADO] },
      },
      include: {
        exame: { select: { nome: true, codigo: true, material: true } },
        ordem: {
          select: {
            protocolo: true,
            prioridade: true,
            paciente: { select: { nome: true } },
          },
        },
        resultado: { select: { status: true } },
      },
      orderBy: [
        { ordem: { prioridade: 'desc' } }, // urgentes primeiro
        { coletadoEm: 'asc' }, // mais antigos primeiro
      ],
    });

    return itens;
  }


  /**
   * NOVO (S1) — Fila do biomédico: resultados digitados aguardando validação.
   */
  async listarAguardandoValidacao(laboratorioId: string) {
    const itens = await this.prisma.itemOrdem.findMany({
      where: {
        ordem: { laboratorioId },
        status: StatusItem.RESULTADO_DIGITADO,
      },
      include: {
        exame: { select: { nome: true, codigo: true } },
        ordem: {
          select: {
            protocolo: true,
            prioridade: true,
            paciente: { select: { nome: true } },
          },
        },
        resultado: { select: { status: true, critico: true, valores: true } },
      },
      orderBy: [{ ordem: { prioridade: 'desc' } }, { coletadoEm: 'asc' }],
    });
    return itens;
  }

  /**
   * Digita ou atualiza o resultado de um item (exame).
   * Compara automaticamente com os valores de referência.
   */
  async digitar(
    itemOrdemId: string,
    dto: DigitarResultadoDto,
    laboratorioId: string,
    biomedicoId: string,
  ) {
    // 1. Busca o item e confirma que pertence ao laboratório
    const item = await this.prisma.itemOrdem.findFirst({
      where: { id: itemOrdemId, ordem: { laboratorioId } },
      include: {
        exame: { include: { valoresRef: true } },
        resultado: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item da ordem não encontrado');
    }

    // 2. Não permite editar resultado já assinado
    if (item.resultado?.status === StatusResult.ASSINADO) {
      throw new ForbiddenException(
        'Este resultado já foi assinado e não pode ser alterado',
      );
    }

    // 3. Analisa os valores digitados contra a referência
    const { valoresAnalisados, temCritico } = this.analisarValores(
      dto.valores,
      item.exame.valoresRef,
    );

    // 4. Cria ou atualiza o resultado (upsert)
    const resultado = await this.prisma.resultadoExame.upsert({
      where: { itemOrdemId },
      create: {
        itemOrdemId,
        biomedicoId,
        valores: valoresAnalisados,
        status: StatusResult.DIGITADO,
        critico: temCritico,
        observacao: dto.observacao,
      },
      update: {
        valores: valoresAnalisados,
        status: StatusResult.DIGITADO,
        critico: temCritico,
        observacao: dto.observacao,
        biomedicoId,
      },
    });

    // 5. Atualiza o status do item
    await this.prisma.itemOrdem.update({
      where: { id: itemOrdemId },
      data: { status: StatusItem.RESULTADO_DIGITADO },
    });

    // Move a OS para EM_DIGITACAO (se ainda estava em coleta)
    await this.prisma.ordemServico.updateMany({
      where: {
        id: item.ordemId,
        status: { in: [StatusOS.COLETA_REALIZADA, StatusOS.EM_COLETA] },
      },
      data: { status: StatusOS.EM_DIGITACAO },
    });

    this.logger.log(`Resultado digitado para item ${itemOrdemId}${temCritico ? ' (CRÍTICO)' : ''}`);

    return {
      ...resultado,
      alertaCritico: temCritico
        ? 'Atenção: este resultado contém valores críticos!'
        : null,
    };
  }

  /**
   * Valida um resultado já digitado (etapa antes da assinatura).
   */
  async validar(itemOrdemId: string, laboratorioId: string) {
    const resultado = await this.obterResultado(itemOrdemId, laboratorioId);

    if (resultado.status !== StatusResult.DIGITADO) {
      throw new BadRequestException(
        'Só é possível validar resultados que foram digitados',
      );
    }

    const atualizado = await this.prisma.resultadoExame.update({
      where: { itemOrdemId },
      data: { status: StatusResult.VALIDADO, validadoEm: new Date() },
    });

    const item = await this.prisma.itemOrdem.update({
      where: { id: itemOrdemId },
      data: { status: StatusItem.VALIDADO },
    });

    // Move a OS para EM_ANALISE
    await this.prisma.ordemServico.updateMany({
      where: { id: item.ordemId, status: StatusOS.EM_DIGITACAO },
      data: { status: StatusOS.EM_ANALISE },
    });

    return atualizado;
  }

  /**
   * Assina o resultado (etapa final).
   * Ao assinar, o item vira LIBERADO. Se todos os itens da ordem
   * estiverem liberados, a ordem é marcada como CONCLUIDA.
   */
  async assinar(
    itemOrdemId: string,
    laboratorioId: string,
    parecerTecnico?: string,
  ) {
    const resultado = await this.obterResultado(itemOrdemId, laboratorioId);

    if (resultado.status !== StatusResult.VALIDADO) {
      throw new BadRequestException(
        'Só é possível assinar resultados validados',
      );
    }

    const atualizado = await this.prisma.resultadoExame.update({
      where: { itemOrdemId },
      data: {
        status: StatusResult.ASSINADO,
        assinadoEm: new Date(),
        parecerTecnico,
      },
      include: { itemOrdem: true },
    });

    // Marca o item como LIBERADO
    await this.prisma.itemOrdem.update({
      where: { id: itemOrdemId },
      data: { status: StatusItem.LIBERADO },
    });

    // Verifica se todos os itens da ordem estão liberados
    await this.verificarConclusaoOrdem(atualizado.itemOrdem.ordemId);

    this.logger.log(`Resultado assinado para item ${itemOrdemId}`);
    return atualizado;
  }

  // ─── Métodos privados ────────────────────────────────────────────

  /**
   * Compara cada valor digitado com a faixa de referência.
   * Marca cada campo como NORMAL, ALTO, BAIXO ou (qualitativo).
   */
  private analisarValores(
    valoresDigitados: Record<string, any>,
    valoresRef: any[],
  ): { valoresAnalisados: Record<string, any>; temCritico: boolean } {
    const analisados: Record<string, any> = {};
    let temCritico = false;

    for (const [campo, valor] of Object.entries(valoresDigitados)) {
      // Procura a referência correspondente a este campo
      const ref = valoresRef.find((r) => r.campo === campo);

      let situacao = 'NORMAL';
      if (ref && ref.minimo !== null && ref.maximo !== null) {
        const num = parseFloat(String(valor));
        if (!isNaN(num)) {
          if (num < ref.minimo) situacao = 'BAIXO';
          else if (num > ref.maximo) situacao = 'ALTO';

          // Se está fora da faixa E o exame marca como crítico
          if (situacao !== 'NORMAL' && ref.critico) {
            temCritico = true;
          }
        }
      }

      analisados[campo] = {
        valor,
        situacao,
        referencia: ref
          ? ref.minimo !== null
            ? `${ref.minimo} - ${ref.maximo} ${ref.unidade}`
            : ref.textoRef
          : null,
        unidade: ref?.unidade || null,
      };
    }

    return { valoresAnalisados: analisados, temCritico };
  }

  private async obterResultado(itemOrdemId: string, laboratorioId: string) {
    const resultado = await this.prisma.resultadoExame.findFirst({
      where: { itemOrdemId, itemOrdem: { ordem: { laboratorioId } } },
    });
    if (!resultado) {
      throw new NotFoundException('Resultado não encontrado');
    }
    return resultado;
  }

  /**
   * Se todos os itens da ordem estão LIBERADOS, marca a OS como CONCLUIDA.
   */
  private async verificarConclusaoOrdem(ordemId: string) {
    const itens = await this.prisma.itemOrdem.findMany({ where: { ordemId } });
    const todosLiberados = itens.every((i) => i.status === StatusItem.LIBERADO);

    if (todosLiberados) {
      await this.prisma.ordemServico.update({
        where: { id: ordemId },
        data: { status: StatusOS.LIBERADA },
      });
      this.logger.log(`Ordem ${ordemId} concluída — todos os exames liberados`);
    }
  }
}

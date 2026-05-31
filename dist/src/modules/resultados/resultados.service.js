"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ResultadosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultadosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ResultadosService = ResultadosService_1 = class ResultadosService {
    prisma;
    logger = new common_1.Logger(ResultadosService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listarPendentes(laboratorioId) {
        const itens = await this.prisma.itemOrdem.findMany({
            where: {
                ordem: { laboratorioId },
                status: { in: [client_1.StatusItem.COLETADO, client_1.StatusItem.EM_ANALISE, client_1.StatusItem.RESULTADO_DIGITADO] },
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
                { ordem: { prioridade: 'desc' } },
                { coletadoEm: 'asc' },
            ],
        });
        return itens;
    }
    async listarAguardandoValidacao(laboratorioId) {
        const itens = await this.prisma.itemOrdem.findMany({
            where: {
                ordem: { laboratorioId },
                status: client_1.StatusItem.RESULTADO_DIGITADO,
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
    async digitar(itemOrdemId, dto, laboratorioId, biomedicoId) {
        const item = await this.prisma.itemOrdem.findFirst({
            where: { id: itemOrdemId, ordem: { laboratorioId } },
            include: {
                exame: { include: { valoresRef: true } },
                resultado: true,
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Item da ordem não encontrado');
        }
        if (item.resultado?.status === client_1.StatusResult.ASSINADO) {
            throw new common_1.ForbiddenException('Este resultado já foi assinado e não pode ser alterado');
        }
        const { valoresAnalisados, temCritico } = this.analisarValores(dto.valores, item.exame.valoresRef);
        const resultado = await this.prisma.resultadoExame.upsert({
            where: { itemOrdemId },
            create: {
                itemOrdemId,
                biomedicoId,
                valores: valoresAnalisados,
                status: client_1.StatusResult.DIGITADO,
                critico: temCritico,
                observacao: dto.observacao,
            },
            update: {
                valores: valoresAnalisados,
                status: client_1.StatusResult.DIGITADO,
                critico: temCritico,
                observacao: dto.observacao,
                biomedicoId,
            },
        });
        await this.prisma.itemOrdem.update({
            where: { id: itemOrdemId },
            data: { status: client_1.StatusItem.RESULTADO_DIGITADO },
        });
        await this.prisma.ordemServico.updateMany({
            where: {
                id: item.ordemId,
                status: { in: [client_1.StatusOS.COLETA_REALIZADA, client_1.StatusOS.EM_COLETA] },
            },
            data: { status: client_1.StatusOS.EM_DIGITACAO },
        });
        this.logger.log(`Resultado digitado para item ${itemOrdemId}${temCritico ? ' (CRÍTICO)' : ''}`);
        return {
            ...resultado,
            alertaCritico: temCritico
                ? 'Atenção: este resultado contém valores críticos!'
                : null,
        };
    }
    async validar(itemOrdemId, laboratorioId) {
        const resultado = await this.obterResultado(itemOrdemId, laboratorioId);
        if (resultado.status !== client_1.StatusResult.DIGITADO) {
            throw new common_1.BadRequestException('Só é possível validar resultados que foram digitados');
        }
        const atualizado = await this.prisma.resultadoExame.update({
            where: { itemOrdemId },
            data: { status: client_1.StatusResult.VALIDADO, validadoEm: new Date() },
        });
        const item = await this.prisma.itemOrdem.update({
            where: { id: itemOrdemId },
            data: { status: client_1.StatusItem.VALIDADO },
        });
        await this.prisma.ordemServico.updateMany({
            where: { id: item.ordemId, status: client_1.StatusOS.EM_DIGITACAO },
            data: { status: client_1.StatusOS.EM_ANALISE },
        });
        return atualizado;
    }
    async assinar(itemOrdemId, laboratorioId, parecerTecnico) {
        const resultado = await this.obterResultado(itemOrdemId, laboratorioId);
        if (resultado.status !== client_1.StatusResult.VALIDADO) {
            throw new common_1.BadRequestException('Só é possível assinar resultados validados');
        }
        const atualizado = await this.prisma.resultadoExame.update({
            where: { itemOrdemId },
            data: {
                status: client_1.StatusResult.ASSINADO,
                assinadoEm: new Date(),
                parecerTecnico,
            },
            include: { itemOrdem: true },
        });
        await this.prisma.itemOrdem.update({
            where: { id: itemOrdemId },
            data: { status: client_1.StatusItem.LIBERADO },
        });
        await this.verificarConclusaoOrdem(atualizado.itemOrdem.ordemId);
        this.logger.log(`Resultado assinado para item ${itemOrdemId}`);
        return atualizado;
    }
    analisarValores(valoresDigitados, valoresRef) {
        const analisados = {};
        let temCritico = false;
        for (const [campo, valor] of Object.entries(valoresDigitados)) {
            const ref = valoresRef.find((r) => r.campo === campo);
            let situacao = 'NORMAL';
            if (ref && ref.minimo !== null && ref.maximo !== null) {
                const num = parseFloat(String(valor));
                if (!isNaN(num)) {
                    if (num < ref.minimo)
                        situacao = 'BAIXO';
                    else if (num > ref.maximo)
                        situacao = 'ALTO';
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
    async obterResultado(itemOrdemId, laboratorioId) {
        const resultado = await this.prisma.resultadoExame.findFirst({
            where: { itemOrdemId, itemOrdem: { ordem: { laboratorioId } } },
        });
        if (!resultado) {
            throw new common_1.NotFoundException('Resultado não encontrado');
        }
        return resultado;
    }
    async verificarConclusaoOrdem(ordemId) {
        const itens = await this.prisma.itemOrdem.findMany({ where: { ordemId } });
        const todosLiberados = itens.every((i) => i.status === client_1.StatusItem.LIBERADO);
        if (todosLiberados) {
            await this.prisma.ordemServico.update({
                where: { id: ordemId },
                data: { status: client_1.StatusOS.LIBERADA },
            });
            this.logger.log(`Ordem ${ordemId} concluída — todos os exames liberados`);
        }
    }
};
exports.ResultadosService = ResultadosService;
exports.ResultadosService = ResultadosService = ResultadosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResultadosService);
//# sourceMappingURL=resultados.service.js.map
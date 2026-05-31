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
var OrdensService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdensService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrdensService = OrdensService_1 = class OrdensService {
    prisma;
    logger = new common_1.Logger(OrdensService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, laboratorioId, solicitanteId) {
        const paciente = await this.prisma.paciente.findFirst({
            where: { id: dto.pacienteId, laboratorioId, ativo: true },
        });
        if (!paciente) {
            throw new common_1.BadRequestException('Paciente não encontrado');
        }
        const unidade = await this.prisma.unidadeSaude.findFirst({
            where: { id: dto.unidadeId, laboratorioId },
        });
        if (!unidade) {
            throw new common_1.BadRequestException('Unidade não encontrada');
        }
        if (!dto.exameIds || dto.exameIds.length === 0) {
            throw new common_1.BadRequestException('Selecione ao menos um exame');
        }
        const exames = await this.prisma.exameCatalogo.findMany({
            where: { id: { in: dto.exameIds }, laboratorioId, ativo: true },
        });
        if (exames.length !== dto.exameIds.length) {
            throw new common_1.BadRequestException('Um ou mais exames são inválidos');
        }
        const protocolo = await this.gerarProtocolo(laboratorioId);
        const ordem = await this.prisma.ordemServico.create({
            data: {
                laboratorioId,
                protocolo,
                pacienteId: dto.pacienteId,
                unidadeId: dto.unidadeId,
                solicitanteId,
                medicoSolicitante: dto.medicoSolicitante,
                prioridade: dto.prioridade ?? 'NORMAL',
                observacoes: dto.observacoes,
                status: client_1.StatusOS.AGENDADA,
                dataAgendamento: dto.dataAgendamento ? new Date(dto.dataAgendamento) : new Date(),
                itens: {
                    create: exames.map((exame) => ({
                        exameId: exame.id,
                        prazoEntrega: new Date(Date.now() + exame.prazoHoras * 60 * 60 * 1000),
                    })),
                },
            },
            include: {
                itens: { include: { exame: { select: { nome: true, codigo: true } } } },
            },
        });
        this.logger.log(`OS agendada: ${protocolo} — ${exames.length} exame(s)`);
        return ordem;
    }
    async findAll(laboratorioId, filtros) {
        const pagina = filtros.pagina || 1;
        const limite = Math.min(filtros.limite || 20, 100);
        const skip = (pagina - 1) * limite;
        const where = {
            laboratorioId,
            ...(filtros.status && { status: filtros.status }),
        };
        const [ordens, total] = await Promise.all([
            this.prisma.ordemServico.findMany({
                where,
                skip,
                take: limite,
                orderBy: { createdAt: 'desc' },
                include: {
                    paciente: { select: { id: true, nome: true } },
                    unidade: { select: { id: true, nome: true } },
                    _count: { select: { itens: true } },
                },
            }),
            this.prisma.ordemServico.count({ where }),
        ]);
        return {
            dados: ordens,
            paginacao: { pagina, limite, total, totalPaginas: Math.ceil(total / limite) },
        };
    }
    async agendaDoDia(laboratorioId, data) {
        const dia = data ? new Date(data) : new Date();
        const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
        const fim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59);
        const ordens = await this.prisma.ordemServico.findMany({
            where: {
                laboratorioId,
                dataAgendamento: { gte: inicio, lte: fim },
                status: { in: [client_1.StatusOS.AGENDADA, client_1.StatusOS.COLETA_REALIZADA] },
            },
            orderBy: [{ prioridade: 'desc' }, { dataAgendamento: 'asc' }],
            include: {
                paciente: { select: { id: true, nome: true } },
                unidade: { select: { nome: true } },
                _count: { select: { itens: true } },
            },
        });
        return {
            data: inicio.toISOString().split('T')[0],
            total: ordens.length,
            ordens,
        };
    }
    async findOne(id, laboratorioId) {
        const ordem = await this.prisma.ordemServico.findFirst({
            where: { id, laboratorioId },
            include: {
                paciente: { select: { id: true, nome: true } },
                unidade: { select: { id: true, nome: true } },
                solicitante: { select: { id: true, name: true } },
                itens: {
                    include: {
                        exame: { select: { nome: true, codigo: true, material: true } },
                    },
                },
            },
        });
        if (!ordem) {
            throw new common_1.NotFoundException('Ordem de serviço não encontrada');
        }
        return ordem;
    }
    async registrarColeta(ordemId, itemId, laboratorioId) {
        await this.findOne(ordemId, laboratorioId);
        const item = await this.prisma.itemOrdem.findFirst({
            where: { id: itemId, ordemId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Item da ordem não encontrado');
        }
        const itemAtualizado = await this.prisma.itemOrdem.update({
            where: { id: itemId },
            data: { status: client_1.StatusItem.COLETADO, coletadoEm: new Date() },
        });
        await this.atualizarStatusOrdem(ordemId);
        return itemAtualizado;
    }
    async registrarColetaCompleta(ordemId, laboratorioId) {
        await this.findOne(ordemId, laboratorioId);
        await this.prisma.itemOrdem.updateMany({
            where: { ordemId, status: client_1.StatusItem.AGUARDANDO_COLETA },
            data: { status: client_1.StatusItem.COLETADO, coletadoEm: new Date() },
        });
        await this.prisma.ordemServico.update({
            where: { id: ordemId },
            data: { status: client_1.StatusOS.COLETA_REALIZADA, dataColeta: new Date() },
        });
        this.logger.log(`Coleta completa registrada — OS ${ordemId}`);
        return { message: 'Coleta de todos os exames registrada' };
    }
    async cancelar(id, laboratorioId) {
        const ordem = await this.findOne(id, laboratorioId);
        if (ordem.status === client_1.StatusOS.LIBERADA || ordem.status === client_1.StatusOS.CONCLUIDA) {
            throw new common_1.BadRequestException('Não é possível cancelar uma OS já liberada');
        }
        return this.prisma.ordemServico.update({
            where: { id },
            data: { status: client_1.StatusOS.CANCELADA },
        });
    }
    async gerarProtocolo(laboratorioId) {
        const hoje = new Date();
        const dataStr = `${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`;
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const contagem = await this.prisma.ordemServico.count({
            where: { laboratorioId, createdAt: { gte: inicioDia } },
        });
        const sequencial = String(contagem + 1).padStart(5, '0');
        return `LAB-${dataStr}-${sequencial}`;
    }
    async atualizarStatusOrdem(ordemId) {
        const itens = await this.prisma.itemOrdem.findMany({ where: { ordemId } });
        const algumColetado = itens.some((i) => i.status !== client_1.StatusItem.AGUARDANDO_COLETA);
        if (algumColetado) {
            const ordem = await this.prisma.ordemServico.findUnique({ where: { id: ordemId } });
            if (ordem && (ordem.status === client_1.StatusOS.AGENDADA || ordem.status === client_1.StatusOS.ABERTA)) {
                await this.prisma.ordemServico.update({
                    where: { id: ordemId },
                    data: { status: client_1.StatusOS.COLETA_REALIZADA, dataColeta: new Date() },
                });
            }
        }
    }
};
exports.OrdensService = OrdensService;
exports.OrdensService = OrdensService = OrdensService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdensService);
//# sourceMappingURL=ordens.service.js.map
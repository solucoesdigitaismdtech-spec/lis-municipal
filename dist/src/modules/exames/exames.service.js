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
var ExamesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ExamesService = ExamesService_1 = class ExamesService {
    prisma;
    logger = new common_1.Logger(ExamesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, laboratorioId) {
        const existente = await this.prisma.exameCatalogo.findFirst({
            where: { laboratorioId, codigo: dto.codigo },
        });
        if (existente) {
            throw new common_1.ConflictException('Já existe um exame com este código');
        }
        const exame = await this.prisma.exameCatalogo.create({
            data: {
                laboratorioId,
                codigo: dto.codigo,
                nome: dto.nome,
                sigtap: dto.sigtap,
                metodo: dto.metodo,
                material: dto.material,
                categoria: dto.categoria,
                prazoHoras: dto.prazoHoras ?? 24,
                instrucoes: dto.instrucoes,
            },
        });
        this.logger.log(`Exame criado: ${exame.nome} (${exame.codigo})`);
        return exame;
    }
    async findAll(laboratorioId, filtros) {
        return this.prisma.exameCatalogo.findMany({
            where: {
                laboratorioId,
                ativo: true,
                ...(filtros.categoria && { categoria: filtros.categoria }),
                ...(filtros.busca && {
                    nome: { contains: filtros.busca, mode: 'insensitive' },
                }),
            },
            orderBy: { nome: 'asc' },
            include: {
                _count: { select: { valoresRef: true } },
            },
        });
    }
    async findOne(id, laboratorioId) {
        const exame = await this.prisma.exameCatalogo.findFirst({
            where: { id, laboratorioId },
            include: {
                valoresRef: { orderBy: { campo: 'asc' } },
            },
        });
        if (!exame) {
            throw new common_1.NotFoundException('Exame não encontrado');
        }
        return exame;
    }
    async update(id, dto, laboratorioId) {
        await this.findOne(id, laboratorioId);
        const exame = await this.prisma.exameCatalogo.update({
            where: { id },
            data: dto,
        });
        this.logger.log(`Exame atualizado: ${exame.nome}`);
        return exame;
    }
    async remove(id, laboratorioId) {
        await this.findOne(id, laboratorioId);
        await this.prisma.exameCatalogo.update({
            where: { id },
            data: { ativo: false },
        });
        return { message: 'Exame desativado com sucesso' };
    }
    async addValorReferencia(exameId, dto, laboratorioId) {
        await this.findOne(exameId, laboratorioId);
        const valor = await this.prisma.valorReferencia.create({
            data: {
                exameId,
                campo: dto.campo,
                faixaIdade: dto.faixaIdade,
                sexo: dto.sexo,
                minimo: dto.minimo,
                maximo: dto.maximo,
                textoRef: dto.textoRef,
                unidade: dto.unidade,
                critico: dto.critico ?? false,
            },
        });
        this.logger.log(`Valor de referência adicionado ao exame ${exameId}: ${valor.campo}`);
        return valor;
    }
    async removeValorReferencia(exameId, valorId, laboratorioId) {
        await this.findOne(exameId, laboratorioId);
        const valor = await this.prisma.valorReferencia.findFirst({
            where: { id: valorId, exameId },
        });
        if (!valor) {
            throw new common_1.NotFoundException('Valor de referência não encontrado');
        }
        await this.prisma.valorReferencia.delete({ where: { id: valorId } });
        return { message: 'Valor de referência removido' };
    }
};
exports.ExamesService = ExamesService;
exports.ExamesService = ExamesService = ExamesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamesService);
//# sourceMappingURL=exames.service.js.map
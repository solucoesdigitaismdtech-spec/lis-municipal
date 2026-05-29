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
var UnidadesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnidadesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UnidadesService = UnidadesService_1 = class UnidadesService {
    prisma;
    logger = new common_1.Logger(UnidadesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, laboratorioId) {
        if (dto.cnes) {
            const existing = await this.prisma.unidadeSaude.findFirst({
                where: { laboratorioId, cnes: dto.cnes },
            });
            if (existing) {
                throw new common_1.ConflictException('Já existe uma unidade com este CNES neste laboratório');
            }
        }
        const unidade = await this.prisma.unidadeSaude.create({
            data: {
                nome: dto.nome,
                cnes: dto.cnes,
                endereco: dto.endereco,
                tipo: dto.tipo,
                laboratorioId,
            },
        });
        this.logger.log(`Unidade criada: ${unidade.nome} — lab: ${laboratorioId}`);
        return unidade;
    }
    async findAll(laboratorioId) {
        return this.prisma.unidadeSaude.findMany({
            where: { laboratorioId },
            orderBy: { nome: 'asc' },
            include: {
                _count: { select: { pacientes: true, ordens: true } },
            },
        });
    }
    async findOne(id, laboratorioId) {
        const unidade = await this.prisma.unidadeSaude.findFirst({
            where: { id, laboratorioId },
        });
        if (!unidade) {
            throw new common_1.NotFoundException('Unidade não encontrada');
        }
        return unidade;
    }
    async update(id, dto, laboratorioId) {
        await this.findOne(id, laboratorioId);
        const unidade = await this.prisma.unidadeSaude.update({
            where: { id },
            data: dto,
        });
        this.logger.log(`Unidade atualizada: ${unidade.nome}`);
        return unidade;
    }
    async toggleActive(id, ativa, laboratorioId) {
        await this.findOne(id, laboratorioId);
        return this.prisma.unidadeSaude.update({
            where: { id },
            data: { ativa },
            select: { id: true, nome: true, ativa: true },
        });
    }
};
exports.UnidadesService = UnidadesService;
exports.UnidadesService = UnidadesService = UnidadesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnidadesService);
//# sourceMappingURL=unidades.service.js.map
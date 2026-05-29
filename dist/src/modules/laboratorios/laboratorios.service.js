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
var LaboratoriosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaboratoriosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LaboratoriosService = LaboratoriosService_1 = class LaboratoriosService {
    prisma;
    logger = new common_1.Logger(LaboratoriosService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.laboratorio.findUnique({
            where: { cnes: dto.cnes },
        });
        if (existing) {
            throw new common_1.ConflictException('Já existe um laboratório com este CNES');
        }
        const laboratorio = await this.prisma.laboratorio.create({
            data: {
                nome: dto.nome,
                cnes: dto.cnes,
                municipio: dto.municipio,
                uf: dto.uf.toUpperCase(),
                cnpj: dto.cnpj,
                responsavelTecnico: dto.responsavelTecnico,
                crbm: dto.crbm,
            },
        });
        this.logger.log(`Laboratório criado: ${laboratorio.nome} (${laboratorio.municipio}/${laboratorio.uf})`);
        return laboratorio;
    }
    async findAll() {
        return this.prisma.laboratorio.findMany({
            orderBy: { nome: 'asc' },
            include: {
                _count: {
                    select: { users: true, unidades: true, pacientes: true },
                },
            },
        });
    }
    async findOne(id) {
        const laboratorio = await this.prisma.laboratorio.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true, unidades: true, pacientes: true, ordens: true },
                },
            },
        });
        if (!laboratorio) {
            throw new common_1.NotFoundException('Laboratório não encontrado');
        }
        return laboratorio;
    }
    async update(id, dto) {
        await this.findOne(id);
        const laboratorio = await this.prisma.laboratorio.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.uf && { uf: dto.uf.toUpperCase() }),
            },
        });
        this.logger.log(`Laboratório atualizado: ${laboratorio.nome}`);
        return laboratorio;
    }
    async toggleActive(id, ativo) {
        await this.findOne(id);
        return this.prisma.laboratorio.update({
            where: { id },
            data: { ativo },
            select: { id: true, nome: true, ativo: true },
        });
    }
};
exports.LaboratoriosService = LaboratoriosService;
exports.LaboratoriosService = LaboratoriosService = LaboratoriosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LaboratoriosService);
//# sourceMappingURL=laboratorios.service.js.map
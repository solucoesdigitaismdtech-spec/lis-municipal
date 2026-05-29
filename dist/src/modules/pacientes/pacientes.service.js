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
var PacientesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_service_1 = require("../../common/crypto/crypto.service");
const cpf_util_1 = require("../../common/utils/cpf.util");
let PacientesService = PacientesService_1 = class PacientesService {
    prisma;
    crypto;
    logger = new common_1.Logger(PacientesService_1.name);
    constructor(prisma, crypto) {
        this.prisma = prisma;
        this.crypto = crypto;
    }
    async create(dto, laboratorioId) {
        if (!(0, cpf_util_1.validarCpf)(dto.cpf)) {
            throw new common_1.BadRequestException('CPF inválido');
        }
        const cpfLimpo = (0, cpf_util_1.normalizarCpf)(dto.cpf);
        const cpfHash = this.crypto.hashCpf(cpfLimpo);
        const existente = await this.prisma.paciente.findFirst({
            where: { laboratorioId, cpfHash },
        });
        if (existente) {
            throw new common_1.ConflictException('Já existe um paciente com este CPF');
        }
        const unidade = await this.prisma.unidadeSaude.findFirst({
            where: { id: dto.unidadeId, laboratorioId },
        });
        if (!unidade) {
            throw new common_1.BadRequestException('Unidade de saúde inválida');
        }
        const paciente = await this.prisma.paciente.create({
            data: {
                laboratorioId,
                unidadeId: dto.unidadeId,
                nome: dto.nome,
                cpfHash,
                cpfEncrypted: this.crypto.encrypt(cpfLimpo),
                cns: dto.cns,
                dataNascimento: new Date(dto.dataNascimento),
                sexo: dto.sexo,
                nomeMaeEncrypted: dto.nomeMae ? this.crypto.encrypt(dto.nomeMae) : null,
                telefoneEncrypted: dto.telefone ? this.crypto.encrypt(dto.telefone) : null,
                whatsappEncrypted: dto.whatsapp ? this.crypto.encrypt(dto.whatsapp) : null,
                emailEncrypted: dto.email ? this.crypto.encrypt(dto.email) : null,
                enderecoEncrypted: dto.endereco
                    ? this.crypto.encrypt(JSON.stringify(dto.endereco))
                    : undefined,
                origem: 'LOCAL',
            },
        });
        this.logger.log(`Paciente criado: ${paciente.nome} — lab: ${laboratorioId}`);
        return this.toSafeResponse(paciente);
    }
    async findAll(laboratorioId, params) {
        const pagina = params.pagina || 1;
        const limite = Math.min(params.limite || 20, 100);
        const skip = (pagina - 1) * limite;
        const where = {
            laboratorioId,
            ativo: true,
            ...(params.busca && {
                nome: { contains: params.busca, mode: 'insensitive' },
            }),
        };
        const [pacientes, total] = await Promise.all([
            this.prisma.paciente.findMany({
                where,
                skip,
                take: limite,
                orderBy: { nome: 'asc' },
                include: {
                    unidade: { select: { id: true, nome: true } },
                },
            }),
            this.prisma.paciente.count({ where }),
        ]);
        return {
            dados: pacientes.map((p) => this.toListResponse(p)),
            paginacao: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        };
    }
    async findByCpf(cpf, laboratorioId) {
        if (!(0, cpf_util_1.validarCpf)(cpf)) {
            throw new common_1.BadRequestException('CPF inválido');
        }
        const cpfHash = this.crypto.hashCpf((0, cpf_util_1.normalizarCpf)(cpf));
        const paciente = await this.prisma.paciente.findFirst({
            where: { laboratorioId, cpfHash },
            include: { unidade: { select: { id: true, nome: true } } },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente não encontrado');
        }
        return this.toSafeResponse(paciente);
    }
    async findOne(id, laboratorioId) {
        const paciente = await this.prisma.paciente.findFirst({
            where: { id, laboratorioId },
            include: { unidade: { select: { id: true, nome: true } } },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente não encontrado');
        }
        return this.toSafeResponse(paciente);
    }
    async update(id, dto, laboratorioId) {
        await this.findOne(id, laboratorioId);
        const data = {};
        if (dto.nome !== undefined)
            data.nome = dto.nome;
        if (dto.cns !== undefined)
            data.cns = dto.cns;
        if (dto.dataNascimento !== undefined)
            data.dataNascimento = new Date(dto.dataNascimento);
        if (dto.sexo !== undefined)
            data.sexo = dto.sexo;
        if (dto.unidadeId !== undefined) {
            const unidade = await this.prisma.unidadeSaude.findFirst({
                where: { id: dto.unidadeId, laboratorioId },
            });
            if (!unidade)
                throw new common_1.BadRequestException('Unidade inválida');
            data.unidadeId = dto.unidadeId;
        }
        if (dto.nomeMae !== undefined)
            data.nomeMaeEncrypted = dto.nomeMae ? this.crypto.encrypt(dto.nomeMae) : null;
        if (dto.telefone !== undefined)
            data.telefoneEncrypted = dto.telefone ? this.crypto.encrypt(dto.telefone) : null;
        if (dto.whatsapp !== undefined)
            data.whatsappEncrypted = dto.whatsapp ? this.crypto.encrypt(dto.whatsapp) : null;
        if (dto.email !== undefined)
            data.emailEncrypted = dto.email ? this.crypto.encrypt(dto.email) : null;
        if (dto.endereco !== undefined)
            data.enderecoEncrypted = dto.endereco
                ? this.crypto.encrypt(JSON.stringify(dto.endereco))
                : null;
        const paciente = await this.prisma.paciente.update({
            where: { id },
            data,
            include: { unidade: { select: { id: true, nome: true } } },
        });
        this.logger.log(`Paciente atualizado: ${paciente.nome}`);
        return this.toSafeResponse(paciente);
    }
    async remove(id, laboratorioId) {
        await this.findOne(id, laboratorioId);
        await this.prisma.paciente.update({
            where: { id },
            data: { ativo: false },
        });
        return { message: 'Paciente desativado com sucesso' };
    }
    toSafeResponse(paciente) {
        const cpf = this.crypto.decrypt(paciente.cpfEncrypted);
        return {
            id: paciente.id,
            nome: paciente.nome,
            cpf: (0, cpf_util_1.mascararCpf)(cpf),
            cns: paciente.cns,
            dataNascimento: paciente.dataNascimento,
            sexo: paciente.sexo,
            nomeMae: paciente.nomeMaeEncrypted
                ? this.crypto.decrypt(paciente.nomeMaeEncrypted)
                : null,
            telefone: paciente.telefoneEncrypted
                ? this.crypto.decrypt(paciente.telefoneEncrypted)
                : null,
            whatsapp: paciente.whatsappEncrypted
                ? this.crypto.decrypt(paciente.whatsappEncrypted)
                : null,
            email: paciente.emailEncrypted
                ? this.crypto.decrypt(paciente.emailEncrypted)
                : null,
            endereco: paciente.enderecoEncrypted
                ? JSON.parse(this.crypto.decrypt(paciente.enderecoEncrypted))
                : null,
            origem: paciente.origem,
            unidade: paciente.unidade,
            ativo: paciente.ativo,
            createdAt: paciente.createdAt,
        };
    }
    toListResponse(paciente) {
        return {
            id: paciente.id,
            nome: paciente.nome,
            cpf: (0, cpf_util_1.mascararCpf)(this.crypto.decrypt(paciente.cpfEncrypted)),
            dataNascimento: paciente.dataNascimento,
            sexo: paciente.sexo,
            origem: paciente.origem,
            unidade: paciente.unidade,
            createdAt: paciente.createdAt,
        };
    }
};
exports.PacientesService = PacientesService;
exports.PacientesService = PacientesService = PacientesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService])
], PacientesService);
//# sourceMappingURL=pacientes.service.js.map
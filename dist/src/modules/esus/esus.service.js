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
var EsusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsusService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_service_1 = require("../../common/crypto/crypto.service");
const esus_connection_service_1 = require("./esus-connection.service");
const cpf_util_1 = require("../../common/utils/cpf.util");
let EsusService = EsusService_1 = class EsusService {
    prisma;
    crypto;
    connection;
    config;
    logger = new common_1.Logger(EsusService_1.name);
    rateLimitPorHora;
    constructor(prisma, crypto, connection, config) {
        this.prisma = prisma;
        this.crypto = crypto;
        this.connection = connection;
        this.config = config;
        this.rateLimitPorHora = parseInt(this.config.get('ESUS_RATE_LIMIT_PER_HOUR', '30'));
    }
    async configurarConexao(dto, laboratorioId, userId) {
        const dadosCriptografados = {
            hostEncrypted: this.crypto.encrypt(dto.host),
            usuarioEncrypted: this.crypto.encrypt(dto.usuario),
            senhaEncrypted: this.crypto.encrypt(dto.senha),
            porta: dto.porta || 5432,
            banco: dto.banco || 'esus',
        };
        const teste = await this.connection.testarConexao(dadosCriptografados);
        const conexao = await this.prisma.esusConexao.upsert({
            where: { laboratorioId },
            create: {
                laboratorioId,
                criadoPorId: userId,
                ...dadosCriptografados,
                ativa: teste.ok,
                ultimoTesteEm: new Date(),
                statusConexao: teste.ok ? 'OK' : 'ERRO',
                erroConexao: teste.ok ? null : teste.mensagem,
            },
            update: {
                ...dadosCriptografados,
                ativa: teste.ok,
                ultimoTesteEm: new Date(),
                statusConexao: teste.ok ? 'OK' : 'ERRO',
                erroConexao: teste.ok ? null : teste.mensagem,
            },
        });
        this.logger.log(`Conexão e-SUS configurada — lab: ${laboratorioId} — status: ${conexao.statusConexao}`);
        return {
            id: conexao.id,
            porta: conexao.porta,
            banco: conexao.banco,
            ativa: conexao.ativa,
            statusConexao: conexao.statusConexao,
            erroConexao: conexao.erroConexao,
            ultimoTesteEm: conexao.ultimoTesteEm,
            testeResultado: teste,
        };
    }
    async obterStatusConexao(laboratorioId) {
        const conexao = await this.prisma.esusConexao.findUnique({
            where: { laboratorioId },
            select: {
                id: true,
                porta: true,
                banco: true,
                ativa: true,
                statusConexao: true,
                erroConexao: true,
                ultimoTesteEm: true,
                createdAt: true,
            },
        });
        if (!conexao) {
            return { configurada: false };
        }
        return { configurada: true, ...conexao };
    }
    async testarConexaoExistente(laboratorioId) {
        const conexao = await this.obterConexaoCompleta(laboratorioId);
        const teste = await this.connection.testarConexao(conexao);
        await this.prisma.esusConexao.update({
            where: { laboratorioId },
            data: {
                ultimoTesteEm: new Date(),
                statusConexao: teste.ok ? 'OK' : 'ERRO',
                erroConexao: teste.ok ? null : teste.mensagem,
                ativa: teste.ok,
            },
        });
        return teste;
    }
    async buscarPaciente(cpf, laboratorioId, userId, ip, userAgent) {
        if (!(0, cpf_util_1.validarCpf)(cpf)) {
            throw new common_1.BadRequestException('CPF inválido');
        }
        const cpfLimpo = (0, cpf_util_1.normalizarCpf)(cpf);
        const cpfHash = this.crypto.hashCpf(cpfLimpo);
        await this.verificarRateLimit(userId);
        const conexao = await this.obterConexaoCompleta(laboratorioId);
        if (!conexao.ativa) {
            throw new common_1.BadRequestException('Conexão e-SUS inativa. Verifique a configuração.');
        }
        const inicio = Date.now();
        let cidadao = null;
        let erro = null;
        try {
            cidadao = await this.connection.buscarCidadaoPorCpf(conexao, cpfLimpo);
        }
        catch (e) {
            erro = e.message;
            this.logger.error(`Erro ao buscar no e-SUS: ${e.message}`);
        }
        const duracaoMs = Date.now() - inicio;
        await this.prisma.esusAccessLog.create({
            data: {
                laboratorioId,
                userId,
                cpfHashConsultado: cpfHash,
                encontrado: !!cidadao,
                duracaoMs,
                ip,
                userAgent,
                erro,
            },
        });
        if (erro) {
            throw new common_1.BadRequestException('Não foi possível consultar o e-SUS no momento. Tente novamente.');
        }
        if (!cidadao) {
            return { encontrado: false, mensagem: 'Paciente não encontrado no e-SUS' };
        }
        const hashIntegridade = this.crypto.hashObject(cidadao);
        const snapshot = await this.prisma.pacienteEsusSnapshot.create({
            data: {
                laboratorioId,
                cpfHash,
                dadosBrutos: cidadao,
                hashIntegridade,
                buscadoPorId: userId,
                ipBusca: ip,
            },
        });
        this.logger.log(`Paciente encontrado no e-SUS — snapshot: ${snapshot.id}`);
        return {
            encontrado: true,
            snapshotId: snapshot.id,
            dados: {
                nome: cidadao.nome,
                cpf: this.crypto.maskCpf(cidadao.cpf || cpfLimpo),
                cns: cidadao.cns,
                dataNascimento: cidadao.data_nascimento,
                sexo: cidadao.sexo,
                nomeMae: cidadao.nome_mae,
                telefone: cidadao.telefone,
            },
        };
    }
    async obterConexaoCompleta(laboratorioId) {
        const conexao = await this.prisma.esusConexao.findUnique({
            where: { laboratorioId },
        });
        if (!conexao) {
            throw new common_1.NotFoundException('Conexão e-SUS não configurada para este laboratório');
        }
        return conexao;
    }
    async verificarRateLimit(userId) {
        const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
        const buscasNaUltimaHora = await this.prisma.esusAccessLog.count({
            where: {
                userId,
                createdAt: { gte: umaHoraAtras },
            },
        });
        if (buscasNaUltimaHora >= this.rateLimitPorHora) {
            this.logger.warn(`Rate limit excedido — userId: ${userId}`);
            throw new common_1.ForbiddenException(`Limite de ${this.rateLimitPorHora} buscas por hora atingido. Tente mais tarde.`);
        }
    }
};
exports.EsusService = EsusService;
exports.EsusService = EsusService = EsusService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        esus_connection_service_1.EsusConnectionService,
        config_1.ConfigService])
], EsusService);
//# sourceMappingURL=esus.service.js.map
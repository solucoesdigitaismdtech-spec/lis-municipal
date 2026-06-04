"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LaudosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaudosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const QRCode = __importStar(require("qrcode"));
let LaudosService = LaudosService_1 = class LaudosService {
    prisma;
    logger = new common_1.Logger(LaudosService_1.name);
    urlBaseVerificacao = process.env.URL_VERIFICACAO_LAUDO || 'http://localhost:3000/verificar';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(laboratorioId) {
        const ordens = await this.prisma.ordemServico.findMany({
            where: {
                laboratorioId,
                status: 'CONCLUIDA',
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
    async gerar(ordemId, laboratorioId) {
        const ordem = await this.prisma.ordemServico.findFirst({
            where: { id: ordemId, laboratorioId },
            include: { itens: true, laudo: true },
        });
        if (!ordem) {
            throw new common_1.NotFoundException('Ordem de serviço não encontrada');
        }
        const todosValidados = ordem.itens.every((i) => i.status === client_1.StatusItem.VALIDADO || i.status === client_1.StatusItem.LIBERADO);
        if (!todosValidados) {
            throw new common_1.BadRequestException('Todos os exames precisam estar validados antes de gerar o laudo');
        }
        if (ordem.laudo) {
            return this.prisma.laudo.findUnique({ where: { id: ordem.laudo.id } });
        }
        const hashAutenticacao = (0, crypto_1.randomBytes)(16).toString('hex');
        const urlVerificacao = `${this.urlBaseVerificacao}/${hashAutenticacao}`;
        let qrCodeUrl = null;
        try {
            qrCodeUrl = await QRCode.toDataURL(urlVerificacao, { width: 200, margin: 1 });
        }
        catch (e) {
            this.logger.warn(`Falha ao gerar QR code: ${e}`);
        }
        const laudo = await this.prisma.laudo.create({
            data: {
                ordemId,
                hashAutenticacao,
                qrCodeUrl,
                status: client_1.StatusLaudo.LIBERADO,
                liberadoEm: new Date(),
            },
        });
        await this.prisma.itemOrdem.updateMany({
            where: { ordemId, status: client_1.StatusItem.VALIDADO },
            data: { status: client_1.StatusItem.LIBERADO },
        });
        this.logger.log(`Laudo gerado: OS ${ordem.protocolo} — hash ${hashAutenticacao}`);
        return laudo;
    }
    async dadosLaudo(ordemId, laboratorioId) {
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
            throw new common_1.NotFoundException('Ordem de serviço não encontrada');
        }
        return ordem;
    }
    async verificar(hash) {
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
};
exports.LaudosService = LaudosService;
exports.LaudosService = LaudosService = LaudosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LaudosService);
//# sourceMappingURL=laudos.service.js.map
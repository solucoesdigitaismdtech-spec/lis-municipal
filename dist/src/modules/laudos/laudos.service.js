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
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_service_1 = require("../../common/crypto/crypto.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const PDFDocument = require("pdfkit");
const QRCode = __importStar(require("qrcode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let LaudosService = LaudosService_1 = class LaudosService {
    prisma;
    crypto;
    config;
    logger = new common_1.Logger(LaudosService_1.name);
    laudosDir = path.join(process.cwd(), 'laudos');
    apiUrl;
    constructor(prisma, crypto, config) {
        this.prisma = prisma;
        this.crypto = crypto;
        this.config = config;
        this.apiUrl = this.config.get('API_URL', 'http://localhost:3333');
        if (!fs.existsSync(this.laudosDir)) {
            fs.mkdirSync(this.laudosDir, { recursive: true });
        }
    }
    async gerarLaudo(ordemId, laboratorioId) {
        const ordem = await this.prisma.ordemServico.findFirst({
            where: { id: ordemId, laboratorioId },
            include: {
                laboratorio: true,
                paciente: true,
                unidade: { select: { nome: true } },
                itens: {
                    include: {
                        exame: { select: { nome: true, metodo: true, material: true } },
                        resultado: true,
                    },
                },
            },
        });
        if (!ordem) {
            throw new common_1.NotFoundException('Ordem de serviço não encontrada');
        }
        if (ordem.status !== client_1.StatusOS.CONCLUIDA) {
            throw new common_1.BadRequestException('O laudo só pode ser gerado quando todos os exames estiverem liberados');
        }
        const hashAutenticacao = crypto.randomBytes(16).toString('hex');
        const laudo = await this.prisma.laudo.upsert({
            where: { ordemId },
            create: {
                ordemId,
                hashAutenticacao,
                status: client_1.StatusLaudo.GERANDO,
            },
            update: {
                hashAutenticacao,
                status: client_1.StatusLaudo.GERANDO,
            },
        });
        const urlValidacao = `${this.apiUrl}/api/laudos/validar/${hashAutenticacao}`;
        const qrCodeDataUrl = await QRCode.toDataURL(urlValidacao, {
            width: 120,
            margin: 1,
        });
        const nomeArquivo = `laudo_${ordem.protocolo}.pdf`;
        const caminhoPdf = path.join(this.laudosDir, nomeArquivo);
        await this.montarPdf(ordem, hashAutenticacao, qrCodeDataUrl, caminhoPdf);
        const laudoFinal = await this.prisma.laudo.update({
            where: { id: laudo.id },
            data: {
                status: client_1.StatusLaudo.LIBERADO,
                urlPdf: `/laudos/${nomeArquivo}`,
                liberadoEm: new Date(),
            },
        });
        this.logger.log(`Laudo gerado: ${ordem.protocolo}`);
        return {
            id: laudoFinal.id,
            protocolo: ordem.protocolo,
            hashAutenticacao,
            urlPdf: laudoFinal.urlPdf,
            urlValidacao,
            status: laudoFinal.status,
        };
    }
    async validarPublico(hash) {
        const laudo = await this.prisma.laudo.findFirst({
            where: { hashAutenticacao: hash },
            include: {
                ordem: {
                    select: {
                        protocolo: true,
                        createdAt: true,
                        paciente: { select: { nome: true } },
                        laboratorio: { select: { nome: true, municipio: true } },
                    },
                },
            },
        });
        if (!laudo) {
            return { valido: false, mensagem: 'Laudo não encontrado ou inválido' };
        }
        return {
            valido: true,
            protocolo: laudo.ordem.protocolo,
            paciente: this.mascaraNome(laudo.ordem.paciente.nome),
            laboratorio: laudo.ordem.laboratorio.nome,
            municipio: laudo.ordem.laboratorio.municipio,
            emitidoEm: laudo.liberadoEm,
            mensagem: 'Laudo autêntico e válido',
        };
    }
    async obterCaminhoPdf(ordemId, laboratorioId) {
        const laudo = await this.prisma.laudo.findFirst({
            where: { ordemId, ordem: { laboratorioId } },
            include: { ordem: { select: { protocolo: true } } },
        });
        if (!laudo || !laudo.urlPdf) {
            throw new common_1.NotFoundException('Laudo não encontrado');
        }
        const nomeArquivo = `laudo_${laudo.ordem.protocolo}.pdf`;
        const caminho = path.join(this.laudosDir, nomeArquivo);
        if (!fs.existsSync(caminho)) {
            throw new common_1.NotFoundException('Arquivo do laudo não encontrado');
        }
        return caminho;
    }
    async montarPdf(ordem, hash, qrCodeDataUrl, caminhoPdf) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(caminhoPdf);
            doc.pipe(stream);
            const cor = '#0d9488';
            const corTexto = '#1f2937';
            doc.fontSize(18).fillColor(cor).text(ordem.laboratorio.nome, { align: 'center' });
            doc
                .fontSize(10)
                .fillColor('#6b7280')
                .text(`${ordem.laboratorio.municipio}/${ordem.laboratorio.uf} — CNES: ${ordem.laboratorio.cnes}`, { align: 'center' });
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(cor).stroke();
            doc.moveDown(1);
            doc.fontSize(14).fillColor(corTexto).text('LAUDO LABORATORIAL', { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).fillColor(corTexto);
            const dataEmissao = new Date().toLocaleDateString('pt-BR');
            doc.text(`Paciente: ${ordem.paciente.nome}`);
            doc.text(`Protocolo: ${ordem.protocolo}`);
            doc.text(`Unidade: ${ordem.unidade.nome}`);
            doc.text(`Data de emissão: ${dataEmissao}`);
            doc.moveDown(1);
            for (const item of ordem.itens) {
                if (!item.resultado)
                    continue;
                doc.moveDown(0.5);
                doc.fontSize(12).fillColor(cor).text(item.exame.nome, { underline: false });
                doc
                    .fontSize(8)
                    .fillColor('#6b7280')
                    .text(`Método: ${item.exame.metodo || 'N/A'} — Material: ${item.exame.material}`);
                doc.moveDown(0.3);
                const valores = item.resultado.valores;
                doc.fontSize(9).fillColor(corTexto);
                for (const [campo, info] of Object.entries(valores)) {
                    const dados = info;
                    const valor = dados.valor ?? dados;
                    const ref = dados.referencia ? `  (Ref: ${dados.referencia})` : '';
                    const situacao = dados.situacao && dados.situacao !== 'NORMAL'
                        ? `  [${dados.situacao}]`
                        : '';
                    const linha = `   ${campo}: ${valor} ${dados.unidade || ''}${ref}${situacao}`;
                    if (dados.situacao && dados.situacao !== 'NORMAL') {
                        doc.fillColor('#dc2626').text(linha);
                        doc.fillColor(corTexto);
                    }
                    else {
                        doc.text(linha);
                    }
                }
                if (item.resultado.parecerTecnico) {
                    doc.moveDown(0.3);
                    doc.fontSize(8).fillColor('#6b7280').text(`Parecer: ${item.resultado.parecerTecnico}`);
                }
                doc.moveDown(0.5);
            }
            doc.moveDown(2);
            const yRodape = doc.y;
            const qrBuffer = Buffer.from(qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
            doc.image(qrBuffer, 50, yRodape, { width: 80 });
            doc
                .fontSize(8)
                .fillColor('#6b7280')
                .text('Escaneie o QR Code para validar a autenticidade deste laudo.', 140, yRodape + 10, {
                width: 300,
            });
            doc.text(`Código de autenticação: ${hash}`, 140, yRodape + 30, { width: 300 });
            doc.end();
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });
    }
    mascaraNome(nome) {
        const partes = nome.split(' ');
        return partes
            .map((p, i) => (i === 0 ? p : p.charAt(0) + '*'))
            .join(' ');
    }
};
exports.LaudosService = LaudosService;
exports.LaudosService = LaudosService = LaudosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        config_1.ConfigService])
], LaudosService);
//# sourceMappingURL=laudos.service.js.map
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
var MapaTrabalhoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapaTrabalhoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const PDFDocument = require("pdfkit");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let MapaTrabalhoService = MapaTrabalhoService_1 = class MapaTrabalhoService {
    prisma;
    logger = new common_1.Logger(MapaTrabalhoService_1.name);
    mapasDir = path.join(process.cwd(), 'mapas-trabalho');
    constructor(prisma) {
        this.prisma = prisma;
        if (!fs.existsSync(this.mapasDir)) {
            fs.mkdirSync(this.mapasDir, { recursive: true });
        }
    }
    async gerarMapaPorOrdem(ordemId, laboratorioId) {
        const ordem = await this.prisma.ordemServico.findFirst({
            where: { id: ordemId, laboratorioId },
            include: {
                laboratorio: { select: { nome: true, municipio: true, uf: true } },
                paciente: { select: { nome: true, dataNascimento: true, sexo: true } },
                unidade: { select: { nome: true } },
                itens: {
                    include: {
                        exame: { include: { valoresRef: { orderBy: { campo: 'asc' } } } },
                    },
                },
            },
        });
        if (!ordem) {
            throw new common_1.NotFoundException('Ordem de serviço não encontrada');
        }
        const nomeArquivo = `mapa_${ordem.protocolo}.pdf`;
        const caminho = path.join(this.mapasDir, nomeArquivo);
        await this.montarPdf([
            {
                protocolo: ordem.protocolo,
                paciente: ordem.paciente,
                unidade: ordem.unidade,
                itens: ordem.itens,
            },
        ], ordem.laboratorio, caminho, `Mapa de Trabalho — ${ordem.protocolo}`);
        this.logger.log(`Mapa de trabalho gerado: ${ordem.protocolo}`);
        return caminho;
    }
    async gerarMapaDoDia(laboratorioId, data) {
        const dia = data ? new Date(data) : new Date();
        const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
        const fim = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59);
        const ordens = await this.prisma.ordemServico.findMany({
            where: {
                laboratorioId,
                itens: {
                    some: {
                        status: { in: [client_1.StatusItem.COLETADO, client_1.StatusItem.EM_ANALISE] },
                        coletadoEm: { gte: inicio, lte: fim },
                    },
                },
            },
            include: {
                laboratorio: { select: { nome: true, municipio: true, uf: true } },
                paciente: { select: { nome: true, dataNascimento: true, sexo: true } },
                unidade: { select: { nome: true } },
                itens: {
                    where: { status: { in: [client_1.StatusItem.COLETADO, client_1.StatusItem.EM_ANALISE] } },
                    include: {
                        exame: { include: { valoresRef: { orderBy: { campo: 'asc' } } } },
                    },
                },
            },
            orderBy: { protocolo: 'asc' },
        });
        if (ordens.length === 0) {
            throw new common_1.BadRequestException('Nenhuma coleta encontrada para esta data');
        }
        const dataStr = inicio.toISOString().split('T')[0];
        const nomeArquivo = `mapa_dia_${dataStr}.pdf`;
        const caminho = path.join(this.mapasDir, nomeArquivo);
        await this.montarPdf(ordens.map((o) => ({
            protocolo: o.protocolo,
            paciente: o.paciente,
            unidade: o.unidade,
            itens: o.itens,
        })), ordens[0].laboratorio, caminho, `Mapa de Trabalho do Dia — ${dataStr}`);
        this.logger.log(`Mapa do dia gerado: ${dataStr} (${ordens.length} pacientes)`);
        return caminho;
    }
    async montarPdf(pacientes, laboratorio, caminho, titulo) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const stream = fs.createWriteStream(caminho);
            doc.pipe(stream);
            const cor = '#0d9488';
            const corTexto = '#1f2937';
            const corLinha = '#d1d5db';
            pacientes.forEach((p, idx) => {
                if (idx > 0)
                    doc.addPage();
                doc.fontSize(14).fillColor(cor).text(laboratorio.nome, { align: 'center' });
                doc
                    .fontSize(9)
                    .fillColor('#6b7280')
                    .text(`${laboratorio.municipio}/${laboratorio.uf}`, { align: 'center' });
                doc.moveDown(0.3);
                doc.fontSize(12).fillColor(corTexto).text(titulo, { align: 'center' });
                doc.moveDown(0.5);
                doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(cor).lineWidth(1).stroke();
                doc.moveDown(0.8);
                const idade = this.calcularIdade(p.paciente.dataNascimento);
                doc.fontSize(11).fillColor(corTexto);
                doc.text(`Protocolo: ${p.protocolo}`, { continued: true });
                doc.text(`     Data: ____/____/______`, { align: 'right' });
                doc.fontSize(10);
                doc.text(`Paciente: ${p.paciente.nome}`);
                doc.text(`Sexo: ${p.paciente.sexo}     Idade: ${idade} anos     Unidade: ${p.unidade.nome}`);
                doc.moveDown(0.8);
                for (const item of p.itens) {
                    if (doc.y > 720)
                        doc.addPage();
                    doc.fontSize(11).fillColor(cor).text(item.exame.nome);
                    doc
                        .fontSize(8)
                        .fillColor('#6b7280')
                        .text(`Material: ${item.exame.material}   Método: ${item.exame.metodo || 'N/A'}`);
                    doc.moveDown(0.3);
                    doc.fontSize(9).fillColor(corTexto);
                    if (item.exame.valoresRef.length > 0) {
                        for (const ref of item.exame.valoresRef) {
                            const referencia = ref.minimo !== null
                                ? `Ref: ${ref.minimo} - ${ref.maximo} ${ref.unidade}`
                                : `Ref: ${ref.textoRef || ''}`;
                            const y = doc.y + 2;
                            doc.text(`${ref.campo}:`, 50, y, { continued: false, width: 150 });
                            doc
                                .moveTo(160, y + 9)
                                .lineTo(400, y + 9)
                                .strokeColor(corLinha)
                                .lineWidth(0.5)
                                .stroke();
                            doc
                                .fontSize(7)
                                .fillColor('#9ca3af')
                                .text(referencia, 410, y, { width: 145 });
                            doc.fontSize(9).fillColor(corTexto);
                            doc.moveDown(0.7);
                        }
                    }
                    else {
                        const y = doc.y + 2;
                        doc.text('Resultado:', 50, y, { width: 150 });
                        doc.moveTo(160, y + 9).lineTo(400, y + 9).strokeColor(corLinha).lineWidth(0.5).stroke();
                        doc.moveDown(0.7);
                    }
                    doc.moveDown(0.5);
                }
                if (doc.y > 700)
                    doc.addPage();
                doc.moveDown(1.5);
                const yAss = doc.y;
                doc.moveTo(60, yAss).lineTo(260, yAss).strokeColor('#9ca3af').stroke();
                doc.fontSize(8).fillColor('#6b7280').text('Biomédico responsável (assinatura)', 60, yAss + 4);
            });
            doc.end();
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });
    }
    calcularIdade(dataNascimento) {
        const hoje = new Date();
        const nasc = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate()))
            idade--;
        return idade;
    }
};
exports.MapaTrabalhoService = MapaTrabalhoService;
exports.MapaTrabalhoService = MapaTrabalhoService = MapaTrabalhoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MapaTrabalhoService);
//# sourceMappingURL=mapa-trabalho.service.js.map
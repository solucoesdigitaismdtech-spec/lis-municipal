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
var PortalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PortalService = PortalService_1 = class PortalService {
    prisma;
    logger = new common_1.Logger(PortalService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async consultar(protocolo, dataNascimento) {
        const ordem = await this.prisma.ordemServico.findFirst({
            where: { protocolo: protocolo.trim().toUpperCase() },
            include: {
                paciente: { select: { nome: true, dataNascimento: true } },
                laboratorio: { select: { nome: true, municipio: true, uf: true } },
                itens: {
                    include: {
                        exame: { select: { nome: true } },
                        resultado: { select: { status: true } },
                    },
                },
                laudo: { select: { status: true, hashAutenticacao: true } },
            },
        });
        if (!ordem) {
            throw new common_1.NotFoundException('Protocolo não encontrado');
        }
        const dataPaciente = ordem.paciente.dataNascimento
            .toISOString()
            .split('T')[0];
        if (dataPaciente !== dataNascimento) {
            throw new common_1.UnauthorizedException('Data de nascimento não confere com o protocolo');
        }
        const exames = ordem.itens.map((item) => ({
            nome: item.exame.nome,
            status: this.traduzirStatusItem(item.status, item.resultado?.status),
            pronto: item.resultado?.status === 'ASSINADO',
        }));
        const laudoPronto = ordem.laudo?.status === 'LIBERADO' &&
            (ordem.status === client_1.StatusOS.LIBERADA || ordem.status === client_1.StatusOS.CONCLUIDA);
        return {
            protocolo: ordem.protocolo,
            paciente: this.mascaraNome(ordem.paciente.nome),
            laboratorio: ordem.laboratorio.nome,
            municipio: `${ordem.laboratorio.municipio}/${ordem.laboratorio.uf}`,
            statusGeral: this.traduzirStatusOrdem(ordem.status),
            exames,
            laudoPronto,
            hashLaudo: laudoPronto ? ordem.laudo?.hashAutenticacao : null,
        };
    }
    traduzirStatusItem(statusItem, statusResultado) {
        if (statusResultado === 'ASSINADO')
            return 'Pronto';
        if (statusItem === client_1.StatusItem.AGUARDANDO_COLETA)
            return 'Aguardando coleta';
        if (statusItem === client_1.StatusItem.COLETADO)
            return 'Em análise';
        if (statusItem === client_1.StatusItem.RESULTADO_DIGITADO)
            return 'Em análise';
        if (statusItem === client_1.StatusItem.VALIDADO)
            return 'Em conferência';
        if (statusItem === client_1.StatusItem.LIBERADO)
            return 'Pronto';
        return 'Em andamento';
    }
    traduzirStatusOrdem(status) {
        const mapa = {
            AGENDADA: 'Agendado',
            COLETA_REALIZADA: 'Coleta realizada',
            EM_DIGITACAO: 'Em análise',
            EM_ANALISE: 'Em conferência',
            LIBERADA: 'Pronto para retirada',
            CONCLUIDA: 'Pronto para retirada',
            CANCELADA: 'Cancelado',
            ABERTA: 'Em andamento',
            EM_COLETA: 'Coleta realizada',
        };
        return mapa[status] || 'Em andamento';
    }
    mascaraNome(nome) {
        const partes = nome.split(' ');
        return partes.map((p, i) => (i === 0 ? p : p.charAt(0) + '*')).join(' ');
    }
};
exports.PortalService = PortalService;
exports.PortalService = PortalService = PortalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PortalService);
//# sourceMappingURL=portal.service.js.map
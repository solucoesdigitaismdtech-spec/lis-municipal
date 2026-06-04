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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaudosController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const laudos_service_1 = require("./laudos.service");
const laudo_pdf_service_1 = require("./laudo-pdf.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let LaudosController = class LaudosController {
    laudosService;
    laudoPdfService;
    constructor(laudosService, laudoPdfService) {
        this.laudosService = laudosService;
        this.laudoPdfService = laudoPdfService;
    }
    listar(laboratorioId) {
        return this.laudosService.listar(laboratorioId);
    }
    dados(ordemId, laboratorioId) {
        return this.laudosService.dadosLaudo(ordemId, laboratorioId);
    }
    gerar(ordemId, laboratorioId) {
        return this.laudosService.gerar(ordemId, laboratorioId);
    }
    async pdf(ordemId, laboratorioId, res) {
        const ordem = await this.laudosService.dadosLaudo(ordemId, laboratorioId);
        if (!ordem) {
            throw new common_1.NotFoundException('Ordem de serviço não encontrada');
        }
        const pdf = await this.laudoPdfService.gerarPdf(ordem);
        const nomeArquivo = `laudo-${ordem.protocolo || ordemId}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${nomeArquivo}"`,
            'Content-Length': pdf.length,
        });
        res.end(pdf);
    }
};
exports.LaudosController = LaudosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('ordem/:ordemId'),
    __param(0, (0, common_1.Param)('ordemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "dados", null);
__decorate([
    (0, common_1.Post)('ordem/:ordemId/gerar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    __param(0, (0, common_1.Param)('ordemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LaudosController.prototype, "gerar", null);
__decorate([
    (0, common_1.Get)('ordem/:ordemId/pdf'),
    __param(0, (0, common_1.Param)('ordemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LaudosController.prototype, "pdf", null);
exports.LaudosController = LaudosController = __decorate([
    (0, common_1.Controller)('laudos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [laudos_service_1.LaudosService,
        laudo_pdf_service_1.LaudoPdfService])
], LaudosController);
//# sourceMappingURL=laudos.controller.js.map
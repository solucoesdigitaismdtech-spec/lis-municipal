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
exports.ResultadosController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const resultados_service_1 = require("./resultados.service");
const digitar_resultado_dto_1 = require("./dto/digitar-resultado.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ResultadosController = class ResultadosController {
    resultadosService;
    constructor(resultadosService) {
        this.resultadosService = resultadosService;
    }
    listarPendentes(laboratorioId) {
        return this.resultadosService.listarPendentes(laboratorioId);
    }
    listarAguardandoValidacao(laboratorioId) {
        return this.resultadosService.listarAguardandoValidacao(laboratorioId);
    }
    digitar(itemOrdemId, dto, laboratorioId, usuarioId) {
        return this.resultadosService.digitar(itemOrdemId, dto, laboratorioId, usuarioId);
    }
    validar(itemOrdemId, laboratorioId) {
        return this.resultadosService.validar(itemOrdemId, laboratorioId);
    }
    assinar(itemOrdemId, parecerTecnico, laboratorioId) {
        return this.resultadosService.assinar(itemOrdemId, laboratorioId, parecerTecnico);
    }
};
exports.ResultadosController = ResultadosController;
__decorate([
    (0, common_1.Get)('pendentes'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResultadosController.prototype, "listarPendentes", null);
__decorate([
    (0, common_1.Get)('aguardando-validacao'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResultadosController.prototype, "listarAguardandoValidacao", null);
__decorate([
    (0, common_1.Post)(':itemOrdemId/digitar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('itemOrdemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, digitar_resultado_dto_1.DigitarResultadoDto, String, String]),
    __metadata("design:returntype", void 0)
], ResultadosController.prototype, "digitar", null);
__decorate([
    (0, common_1.Patch)(':itemOrdemId/validar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    __param(0, (0, common_1.Param)('itemOrdemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResultadosController.prototype, "validar", null);
__decorate([
    (0, common_1.Patch)(':itemOrdemId/assinar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    __param(0, (0, common_1.Param)('itemOrdemId')),
    __param(1, (0, common_1.Body)('parecerTecnico')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ResultadosController.prototype, "assinar", null);
exports.ResultadosController = ResultadosController = __decorate([
    (0, common_1.Controller)('resultados'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [resultados_service_1.ResultadosService])
], ResultadosController);
//# sourceMappingURL=resultados.controller.js.map
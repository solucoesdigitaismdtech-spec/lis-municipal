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
exports.EsusController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const esus_service_1 = require("./esus.service");
const configurar_conexao_dto_1 = require("./dto/configurar-conexao.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let EsusController = class EsusController {
    esusService;
    constructor(esusService) {
        this.esusService = esusService;
    }
    configurarConexao(dto, laboratorioId, userId) {
        return this.esusService.configurarConexao(dto, laboratorioId, userId);
    }
    obterStatus(laboratorioId) {
        return this.esusService.obterStatusConexao(laboratorioId);
    }
    testarConexao(laboratorioId) {
        return this.esusService.testarConexaoExistente(laboratorioId);
    }
    buscarPaciente(cpf, laboratorioId, userId, req) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.ip ||
            'unknown';
        const userAgent = req.headers['user-agent'];
        return this.esusService.buscarPaciente(cpf, laboratorioId, userId, ip, userAgent);
    }
};
exports.EsusController = EsusController;
__decorate([
    (0, common_1.Post)('conexao'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configurar_conexao_dto_1.ConfigurarConexaoDto, String, String]),
    __metadata("design:returntype", void 0)
], EsusController.prototype, "configurarConexao", null);
__decorate([
    (0, common_1.Get)('conexao/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EsusController.prototype, "obterStatus", null);
__decorate([
    (0, common_1.Post)('conexao/testar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EsusController.prototype, "testarConexao", null);
__decorate([
    (0, common_1.Get)('buscar/:cpf'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    __param(0, (0, common_1.Param)('cpf')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], EsusController.prototype, "buscarPaciente", null);
exports.EsusController = EsusController = __decorate([
    (0, common_1.Controller)('esus'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [esus_service_1.EsusService])
], EsusController);
//# sourceMappingURL=esus.controller.js.map
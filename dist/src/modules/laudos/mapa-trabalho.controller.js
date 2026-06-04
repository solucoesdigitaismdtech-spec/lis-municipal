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
exports.MapaTrabalhoController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const mapa_trabalho_service_1 = require("./mapa-trabalho.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let MapaTrabalhoController = class MapaTrabalhoController {
    mapaService;
    constructor(mapaService) {
        this.mapaService = mapaService;
    }
    async porOrdem(ordemId, laboratorioId, res) {
        const caminho = await this.mapaService.gerarMapaPorOrdem(ordemId, laboratorioId);
        return res.download(caminho);
    }
    async doDia(laboratorioId, res, data) {
        const caminho = await this.mapaService.gerarMapaDoDia(laboratorioId, data);
        return res.download(caminho);
    }
};
exports.MapaTrabalhoController = MapaTrabalhoController;
__decorate([
    (0, common_1.Get)('ordem/:ordemId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO, client_1.UserRole.TECNICO),
    __param(0, (0, common_1.Param)('ordemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MapaTrabalhoController.prototype, "porOrdem", null);
__decorate([
    (0, common_1.Get)('dia'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO, client_1.UserRole.TECNICO),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], MapaTrabalhoController.prototype, "doDia", null);
exports.MapaTrabalhoController = MapaTrabalhoController = __decorate([
    (0, common_1.Controller)('mapa-trabalho'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [mapa_trabalho_service_1.MapaTrabalhoService])
], MapaTrabalhoController);
//# sourceMappingURL=mapa-trabalho.controller.js.map
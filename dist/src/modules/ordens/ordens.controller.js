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
exports.OrdensController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ordens_service_1 = require("./ordens.service");
const create_ordem_dto_1 = require("./dto/create-ordem.dto");
const adicionar_item_dto_1 = require("./dto/adicionar-item.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let OrdensController = class OrdensController {
    ordensService;
    constructor(ordensService) {
        this.ordensService = ordensService;
    }
    create(dto, laboratorioId, solicitanteId) {
        return this.ordensService.create(dto, laboratorioId, solicitanteId);
    }
    findAll(laboratorioId, status, pagina, limite) {
        return this.ordensService.findAll(laboratorioId, {
            status,
            pagina: pagina ? parseInt(pagina) : 1,
            limite: limite ? parseInt(limite) : 20,
        });
    }
    findOne(id, laboratorioId) {
        return this.ordensService.findOne(id, laboratorioId);
    }
    registrarColeta(ordemId, itemId, laboratorioId) {
        return this.ordensService.registrarColeta(ordemId, itemId, laboratorioId);
    }
    coletarTudo(id, laboratorioId) {
        return this.ordensService.coletarTudo(id, laboratorioId);
    }
    adicionarItem(ordemId, dto, laboratorioId) {
        return this.ordensService.adicionarItem(ordemId, dto.exameId, laboratorioId);
    }
    removerItem(ordemId, itemId, laboratorioId) {
        return this.ordensService.removerItem(ordemId, itemId, laboratorioId);
    }
    cancelar(id, laboratorioId) {
        return this.ordensService.cancelar(id, laboratorioId);
    }
};
exports.OrdensController = OrdensController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ordem_dto_1.CreateOrdemDto, String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('pagina')),
    __param(3, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/itens/:itemId/coletar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "registrarColeta", null);
__decorate([
    (0, common_1.Patch)(':id/coletar-tudo'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "coletarTudo", null);
__decorate([
    (0, common_1.Post)(':id/itens'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, adicionar_item_dto_1.AdicionarItemDto, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "adicionarItem", null);
__decorate([
    (0, common_1.Delete)(':id/itens/:itemId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.TECNICO),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "removerItem", null);
__decorate([
    (0, common_1.Patch)(':id/cancelar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdensController.prototype, "cancelar", null);
exports.OrdensController = OrdensController = __decorate([
    (0, common_1.Controller)('ordens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ordens_service_1.OrdensService])
], OrdensController);
//# sourceMappingURL=ordens.controller.js.map
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
exports.ExamesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const exames_service_1 = require("./exames.service");
const create_exame_dto_1 = require("./dto/create-exame.dto");
const update_exame_dto_1 = require("./dto/update-exame.dto");
const create_valor_referencia_dto_1 = require("./dto/create-valor-referencia.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ExamesController = class ExamesController {
    examesService;
    constructor(examesService) {
        this.examesService = examesService;
    }
    create(dto, laboratorioId) {
        return this.examesService.create(dto, laboratorioId);
    }
    findAll(laboratorioId, categoria, busca) {
        return this.examesService.findAll(laboratorioId, { categoria, busca });
    }
    findOne(id, laboratorioId) {
        return this.examesService.findOne(id, laboratorioId);
    }
    update(id, dto, laboratorioId) {
        return this.examesService.update(id, dto, laboratorioId);
    }
    remove(id, laboratorioId) {
        return this.examesService.remove(id, laboratorioId);
    }
    addValorReferencia(exameId, dto, laboratorioId) {
        return this.examesService.addValorReferencia(exameId, dto, laboratorioId);
    }
    removeValorReferencia(exameId, valorId, laboratorioId) {
        return this.examesService.removeValorReferencia(exameId, valorId, laboratorioId);
    }
};
exports.ExamesController = ExamesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exame_dto_1.CreateExameDto, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __param(1, (0, common_1.Query)('categoria')),
    __param(2, (0, common_1.Query)('busca')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_exame_dto_1.UpdateExameDto, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/valores-referencia'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_valor_referencia_dto_1.CreateValorReferenciaDto, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "addValorReferencia", null);
__decorate([
    (0, common_1.Delete)(':id/valores-referencia/:valorId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.BIOMEDICO),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('valorId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ExamesController.prototype, "removeValorReferencia", null);
exports.ExamesController = ExamesController = __decorate([
    (0, common_1.Controller)('exames'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [exames_service_1.ExamesService])
], ExamesController);
//# sourceMappingURL=exames.controller.js.map
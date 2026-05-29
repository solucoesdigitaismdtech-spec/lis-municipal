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
exports.LaboratoriosController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const laboratorios_service_1 = require("./laboratorios.service");
const create_laboratorio_dto_1 = require("./dto/create-laboratorio.dto");
const update_laboratorio_dto_1 = require("./dto/update-laboratorio.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let LaboratoriosController = class LaboratoriosController {
    laboratoriosService;
    constructor(laboratoriosService) {
        this.laboratoriosService = laboratoriosService;
    }
    create(dto) {
        return this.laboratoriosService.create(dto);
    }
    findAll() {
        return this.laboratoriosService.findAll();
    }
    findMeu(laboratorioId) {
        return this.laboratoriosService.findOne(laboratorioId);
    }
    findOne(id) {
        return this.laboratoriosService.findOne(id);
    }
    update(id, dto) {
        return this.laboratoriosService.update(id, dto);
    }
    toggleActive(id, ativo) {
        return this.laboratoriosService.toggleActive(id, ativo);
    }
};
exports.LaboratoriosController = LaboratoriosController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_laboratorio_dto_1.CreateLaboratorioDto]),
    __metadata("design:returntype", void 0)
], LaboratoriosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LaboratoriosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('meu'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('laboratorioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LaboratoriosController.prototype, "findMeu", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LaboratoriosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_laboratorio_dto_1.UpdateLaboratorioDto]),
    __metadata("design:returntype", void 0)
], LaboratoriosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('ativo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], LaboratoriosController.prototype, "toggleActive", null);
exports.LaboratoriosController = LaboratoriosController = __decorate([
    (0, common_1.Controller)('laboratorios'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [laboratorios_service_1.LaboratoriosService])
], LaboratoriosController);
//# sourceMappingURL=laboratorios.controller.js.map
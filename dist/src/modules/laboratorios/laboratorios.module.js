"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaboratoriosModule = void 0;
const common_1 = require("@nestjs/common");
const laboratorios_service_1 = require("./laboratorios.service");
const laboratorios_controller_1 = require("./laboratorios.controller");
let LaboratoriosModule = class LaboratoriosModule {
};
exports.LaboratoriosModule = LaboratoriosModule;
exports.LaboratoriosModule = LaboratoriosModule = __decorate([
    (0, common_1.Module)({
        controllers: [laboratorios_controller_1.LaboratoriosController],
        providers: [laboratorios_service_1.LaboratoriosService],
        exports: [laboratorios_service_1.LaboratoriosService],
    })
], LaboratoriosModule);
//# sourceMappingURL=laboratorios.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaudosModule = void 0;
const common_1 = require("@nestjs/common");
const laudos_service_1 = require("./laudos.service");
const laudo_pdf_service_1 = require("./laudo-pdf.service");
const laudos_controller_1 = require("./laudos.controller");
const laudos_publico_controller_1 = require("./laudos-publico.controller");
let LaudosModule = class LaudosModule {
};
exports.LaudosModule = LaudosModule;
exports.LaudosModule = LaudosModule = __decorate([
    (0, common_1.Module)({
        controllers: [laudos_controller_1.LaudosController, laudos_publico_controller_1.LaudosPublicoController],
        providers: [laudos_service_1.LaudosService, laudo_pdf_service_1.LaudoPdfService],
        exports: [laudos_service_1.LaudosService],
    })
], LaudosModule);
//# sourceMappingURL=laudos.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsusModule = void 0;
const common_1 = require("@nestjs/common");
const esus_service_1 = require("./esus.service");
const esus_controller_1 = require("./esus.controller");
const esus_connection_service_1 = require("./esus-connection.service");
let EsusModule = class EsusModule {
};
exports.EsusModule = EsusModule;
exports.EsusModule = EsusModule = __decorate([
    (0, common_1.Module)({
        controllers: [esus_controller_1.EsusController],
        providers: [esus_service_1.EsusService, esus_connection_service_1.EsusConnectionService],
        exports: [esus_service_1.EsusService],
    })
], EsusModule);
//# sourceMappingURL=esus.module.js.map
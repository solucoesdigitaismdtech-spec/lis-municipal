"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdensModule = void 0;
const common_1 = require("@nestjs/common");
const ordens_service_1 = require("./ordens.service");
const ordens_controller_1 = require("./ordens.controller");
let OrdensModule = class OrdensModule {
};
exports.OrdensModule = OrdensModule;
exports.OrdensModule = OrdensModule = __decorate([
    (0, common_1.Module)({
        controllers: [ordens_controller_1.OrdensController],
        providers: [ordens_service_1.OrdensService],
        exports: [ordens_service_1.OrdensService],
    })
], OrdensModule);
//# sourceMappingURL=ordens.module.js.map
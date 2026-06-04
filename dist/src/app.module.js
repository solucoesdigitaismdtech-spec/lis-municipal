"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const prisma_module_1 = require("./prisma/prisma.module");
const crypto_module_1 = require("./common/crypto/crypto.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const laboratorios_module_1 = require("./modules/laboratorios/laboratorios.module");
const unidades_module_1 = require("./modules/unidades/unidades.module");
const pacientes_module_1 = require("./modules/pacientes/pacientes.module");
const esus_module_1 = require("./modules/esus/esus.module");
const exames_module_1 = require("./modules/exames/exames.module");
const ordens_module_1 = require("./modules/ordens/ordens.module");
const resultados_module_1 = require("./modules/resultados/resultados.module");
const laudos_module_1 = require("./modules/laudos/laudos.module");
const portal_module_1 = require("./modules/portal/portal.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'public'),
                serveRoot: '/portal',
                exclude: ['/api/(.*)'],
            }),
            prisma_module_1.PrismaModule,
            crypto_module_1.CryptoModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            laboratorios_module_1.LaboratoriosModule,
            unidades_module_1.UnidadesModule,
            pacientes_module_1.PacientesModule,
            esus_module_1.EsusModule,
            exames_module_1.ExamesModule,
            ordens_module_1.OrdensModule,
            resultados_module_1.ResultadosModule,
            laudos_module_1.LaudosModule,
            portal_module_1.PortalModule,
        ],
        providers: [
            {
                provide: core_1.APP_PIPE,
                useValue: new common_2.ValidationPipe({
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    transform: true,
                    transformOptions: { enableImplicitConversion: true },
                }),
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
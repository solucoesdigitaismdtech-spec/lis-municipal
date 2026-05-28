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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(configService) {
        const connectionString = configService.getOrThrow('DATABASE_URL');
        const adapter = new adapter_pg_1.PrismaPg({ connectionString });
        super({
            adapter,
            log: process.env.NODE_ENV === 'development'
                ? ['warn', 'error']
                : ['error'],
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Banco de dados conectado com sucesso');
        }
        catch (error) {
            this.logger.error('❌ Falha ao conectar ao banco de dados', error);
            process.exit(1);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('🔌 Conexão com banco encerrada');
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('cleanDatabase não pode ser executado em produção!');
        }
        await this.$transaction([
            this.auditLog.deleteMany(),
            this.notificacao.deleteMany(),
            this.laudo.deleteMany(),
            this.resultadoExame.deleteMany(),
            this.itemOrdem.deleteMany(),
            this.ordemServico.deleteMany(),
            this.pacienteEsusSnapshot.deleteMany(),
            this.esusAccessLog.deleteMany(),
            this.paciente.deleteMany(),
            this.valorReferencia.deleteMany(),
            this.exameCatalogo.deleteMany(),
            this.refreshToken.deleteMany(),
            this.esusConexao.deleteMany(),
            this.user.deleteMany(),
            this.unidadeSaude.deleteMany(),
            this.laboratorio.deleteMany(),
        ]);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map
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
var EsusConnectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsusConnectionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const crypto_service_1 = require("../../common/crypto/crypto.service");
let EsusConnectionService = EsusConnectionService_1 = class EsusConnectionService {
    crypto;
    config;
    logger = new common_1.Logger(EsusConnectionService_1.name);
    timeoutMs;
    constructor(crypto, config) {
        this.crypto = crypto;
        this.config = config;
        this.timeoutMs = parseInt(this.config.get('ESUS_CONNECTION_TIMEOUT_MS', '5000'));
    }
    async withConnection(credentials, fn) {
        const host = this.crypto.decrypt(credentials.hostEncrypted);
        const user = this.crypto.decrypt(credentials.usuarioEncrypted);
        const password = this.crypto.decrypt(credentials.senhaEncrypted);
        const client = new pg_1.Client({
            host,
            port: credentials.porta,
            database: credentials.banco,
            user,
            password,
            connectionTimeoutMillis: this.timeoutMs,
            query_timeout: this.timeoutMs,
            statement_timeout: this.timeoutMs,
            ssl: false,
        });
        try {
            await client.connect();
            const resultado = await fn(client);
            return resultado;
        }
        finally {
            await client.end().catch((err) => {
                this.logger.warn(`Erro ao fechar conexão e-SUS: ${err.message}`);
            });
        }
    }
    async testarConexao(credentials) {
        const inicio = Date.now();
        try {
            await this.withConnection(credentials, async (client) => {
                await client.query('SELECT 1');
            });
            return {
                ok: true,
                mensagem: 'Conexão estabelecida com sucesso',
                duracaoMs: Date.now() - inicio,
            };
        }
        catch (error) {
            this.logger.warn(`Falha no teste de conexão e-SUS: ${error.message}`);
            return {
                ok: false,
                mensagem: this.traduzirErro(error),
                duracaoMs: Date.now() - inicio,
            };
        }
    }
    async buscarCidadaoPorCpf(credentials, cpf) {
        return this.withConnection(credentials, async (client) => {
            const query = `
        SELECT
          no_cidadao        AS nome,
          nu_cpf            AS cpf,
          nu_cns            AS cns,
          dt_nascimento     AS data_nascimento,
          no_sexo           AS sexo,
          no_mae            AS nome_mae,
          nu_telefone       AS telefone
        FROM tb_cidadao
        WHERE nu_cpf = $1
        LIMIT 1
      `;
            const resultado = await client.query(query, [cpf]);
            return resultado.rows.length > 0 ? resultado.rows[0] : null;
        });
    }
    traduzirErro(error) {
        const msg = error.message || '';
        if (msg.includes('ECONNREFUSED'))
            return 'Servidor e-SUS recusou a conexão. Verifique host e porta.';
        if (msg.includes('ETIMEDOUT') || msg.includes('timeout'))
            return 'Tempo de conexão esgotado. O servidor e-SUS pode estar inacessível.';
        if (msg.includes('password authentication failed'))
            return 'Usuário ou senha do e-SUS incorretos.';
        if (msg.includes('does not exist'))
            return 'Banco de dados e-SUS não encontrado. Verifique o nome do banco.';
        if (msg.includes('ENOTFOUND'))
            return 'Host do e-SUS não encontrado. Verifique o endereço.';
        return `Erro ao conectar: ${msg}`;
    }
};
exports.EsusConnectionService = EsusConnectionService;
exports.EsusConnectionService = EsusConnectionService = EsusConnectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crypto_service_1.CryptoService,
        config_1.ConfigService])
], EsusConnectionService);
//# sourceMappingURL=esus-connection.service.js.map
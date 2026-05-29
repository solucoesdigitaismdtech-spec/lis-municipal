"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CryptoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let CryptoService = CryptoService_1 = class CryptoService {
    configService;
    logger = new common_1.Logger(CryptoService_1.name);
    algorithm = 'aes-256-gcm';
    IV_LENGTH = 16;
    TAG_LENGTH = 16;
    encryptionKey;
    constructor(configService) {
        this.configService = configService;
        const keyHex = this.configService.get('ENCRYPTION_KEY');
        if (!keyHex) {
            throw new Error('ENCRYPTION_KEY não definida no .env!');
        }
        if (keyHex.length !== 64) {
            throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes). ' +
                'Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        }
        this.encryptionKey = Buffer.from(keyHex, 'hex');
        this.logger.log('🔐 CryptoService inicializado com sucesso');
    }
    encrypt(text) {
        if (!text)
            return text;
        try {
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
            const encrypted = Buffer.concat([
                cipher.update(text, 'utf8'),
                cipher.final(),
            ]);
            const tag = cipher.getAuthTag();
            return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
        }
        catch (error) {
            this.logger.error('Erro ao criptografar dado', error);
            throw new Error('Falha na criptografia');
        }
    }
    decrypt(encryptedText) {
        if (!encryptedText)
            return encryptedText;
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Formato inválido de dado criptografado');
            }
            const [ivHex, tagHex, encryptedHex] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            const encrypted = Buffer.from(encryptedHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(tag);
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);
            return decrypted.toString('utf8');
        }
        catch (error) {
            this.logger.error('Erro ao descriptografar dado', error);
            throw new Error('Falha na descriptografia — dado pode estar corrompido');
        }
    }
    hash(text) {
        if (!text)
            return text;
        return crypto
            .createHash('sha256')
            .update(text.trim().toLowerCase())
            .digest('hex');
    }
    hashCpf(cpf) {
        return crypto
            .createHmac('sha256', this.encryptionKey)
            .update(cpf.trim())
            .digest('hex');
    }
    hashObject(data) {
        const json = JSON.stringify(data, Object.keys(data).sort());
        return crypto.createHash('sha256').update(json).digest('hex');
    }
    maskCpf(cpf) {
        if (!cpf || cpf.length < 11)
            return '***.***.***-**';
        const digits = cpf.replace(/\D/g, '');
        return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = CryptoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CryptoService);
//# sourceMappingURL=crypto.service.js.map
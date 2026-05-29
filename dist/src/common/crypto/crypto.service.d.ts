import { ConfigService } from '@nestjs/config';
export declare class CryptoService {
    private configService;
    private readonly logger;
    private readonly algorithm;
    private readonly IV_LENGTH;
    private readonly TAG_LENGTH;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    encrypt(text: string): string;
    decrypt(encryptedText: string): string;
    hash(text: string): string;
    hashCpf(cpf: string): string;
    hashObject(data: object): string;
    maskCpf(cpf: string): string;
}

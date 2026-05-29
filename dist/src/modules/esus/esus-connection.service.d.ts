import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { CryptoService } from '../../common/crypto/crypto.service';
export declare class EsusConnectionService {
    private crypto;
    private config;
    private readonly logger;
    private readonly timeoutMs;
    constructor(crypto: CryptoService, config: ConfigService);
    withConnection<T>(credentials: {
        hostEncrypted: string;
        usuarioEncrypted: string;
        senhaEncrypted: string;
        porta: number;
        banco: string;
    }, fn: (client: Client) => Promise<T>): Promise<T>;
    testarConexao(credentials: {
        hostEncrypted: string;
        usuarioEncrypted: string;
        senhaEncrypted: string;
        porta: number;
        banco: string;
    }): Promise<{
        ok: boolean;
        mensagem: string;
        duracaoMs: number;
    }>;
    buscarCidadaoPorCpf(credentials: {
        hostEncrypted: string;
        usuarioEncrypted: string;
        senhaEncrypted: string;
        porta: number;
        banco: string;
    }, cpf: string): Promise<Record<string, any> | null>;
    private traduzirErro;
}

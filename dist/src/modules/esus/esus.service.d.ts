import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { EsusConnectionService } from './esus-connection.service';
import { ConfigurarConexaoDto } from './dto/configurar-conexao.dto';
export declare class EsusService {
    private prisma;
    private crypto;
    private connection;
    private config;
    private readonly logger;
    private readonly rateLimitPorHora;
    constructor(prisma: PrismaService, crypto: CryptoService, connection: EsusConnectionService, config: ConfigService);
    configurarConexao(dto: ConfigurarConexaoDto, laboratorioId: string, userId: string): Promise<{
        id: string;
        porta: number;
        banco: string;
        ativa: boolean;
        statusConexao: string | null;
        erroConexao: string | null;
        ultimoTesteEm: Date | null;
        testeResultado: {
            ok: boolean;
            mensagem: string;
            duracaoMs: number;
        };
    }>;
    obterStatusConexao(laboratorioId: string): Promise<{
        configurada: boolean;
    } | {
        id: string;
        createdAt: Date;
        ativa: boolean;
        porta: number;
        banco: string;
        ultimoTesteEm: Date | null;
        statusConexao: string | null;
        erroConexao: string | null;
        configurada: boolean;
    }>;
    testarConexaoExistente(laboratorioId: string): Promise<{
        ok: boolean;
        mensagem: string;
        duracaoMs: number;
    }>;
    buscarPaciente(cpf: string, laboratorioId: string, userId: string, ip: string, userAgent?: string): Promise<{
        encontrado: boolean;
        mensagem: string;
        snapshotId?: undefined;
        dados?: undefined;
    } | {
        encontrado: boolean;
        snapshotId: string;
        dados: {
            nome: any;
            cpf: string;
            cns: any;
            dataNascimento: any;
            sexo: any;
            nomeMae: any;
            telefone: any;
        };
        mensagem?: undefined;
    }>;
    private obterConexaoCompleta;
    private verificarRateLimit;
}

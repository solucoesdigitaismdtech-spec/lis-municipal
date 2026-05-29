import type { Request } from 'express';
import { EsusService } from './esus.service';
import { ConfigurarConexaoDto } from './dto/configurar-conexao.dto';
export declare class EsusController {
    private readonly esusService;
    constructor(esusService: EsusService);
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
    obterStatus(laboratorioId: string): Promise<{
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
    testarConexao(laboratorioId: string): Promise<{
        ok: boolean;
        mensagem: string;
        duracaoMs: number;
    }>;
    buscarPaciente(cpf: string, laboratorioId: string, userId: string, req: Request): Promise<{
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
}

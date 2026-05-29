import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
export declare class PacientesService {
    private prisma;
    private crypto;
    private readonly logger;
    constructor(prisma: PrismaService, crypto: CryptoService);
    create(dto: CreatePacienteDto, laboratorioId: string): Promise<{
        id: string;
        nome: string;
        cpf: string;
        cns: string | null;
        dataNascimento: Date;
        sexo: import("@prisma/client").$Enums.Sexo;
        nomeMae: string | null;
        telefone: string | null;
        whatsapp: string | null;
        email: string | null;
        endereco: any;
        origem: import("@prisma/client").$Enums.PacienteOrigem;
        unidade: any;
        ativo: boolean;
        createdAt: Date;
    }>;
    findAll(laboratorioId: string, params: {
        busca?: string;
        pagina?: number;
        limite?: number;
    }): Promise<{
        dados: {
            id: string;
            nome: string;
            cpf: string;
            dataNascimento: Date;
            sexo: import("@prisma/client").$Enums.Sexo;
            origem: import("@prisma/client").$Enums.PacienteOrigem;
            unidade: any;
            createdAt: Date;
        }[];
        paginacao: {
            pagina: number;
            limite: number;
            total: number;
            totalPaginas: number;
        };
    }>;
    findByCpf(cpf: string, laboratorioId: string): Promise<{
        id: string;
        nome: string;
        cpf: string;
        cns: string | null;
        dataNascimento: Date;
        sexo: import("@prisma/client").$Enums.Sexo;
        nomeMae: string | null;
        telefone: string | null;
        whatsapp: string | null;
        email: string | null;
        endereco: any;
        origem: import("@prisma/client").$Enums.PacienteOrigem;
        unidade: any;
        ativo: boolean;
        createdAt: Date;
    }>;
    findOne(id: string, laboratorioId: string): Promise<{
        id: string;
        nome: string;
        cpf: string;
        cns: string | null;
        dataNascimento: Date;
        sexo: import("@prisma/client").$Enums.Sexo;
        nomeMae: string | null;
        telefone: string | null;
        whatsapp: string | null;
        email: string | null;
        endereco: any;
        origem: import("@prisma/client").$Enums.PacienteOrigem;
        unidade: any;
        ativo: boolean;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdatePacienteDto, laboratorioId: string): Promise<{
        id: string;
        nome: string;
        cpf: string;
        cns: string | null;
        dataNascimento: Date;
        sexo: import("@prisma/client").$Enums.Sexo;
        nomeMae: string | null;
        telefone: string | null;
        whatsapp: string | null;
        email: string | null;
        endereco: any;
        origem: import("@prisma/client").$Enums.PacienteOrigem;
        unidade: any;
        ativo: boolean;
        createdAt: Date;
    }>;
    remove(id: string, laboratorioId: string): Promise<{
        message: string;
    }>;
    private toSafeResponse;
    private toListResponse;
}

import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    private readonly logger;
    private readonly BCRYPT_ROUNDS;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto, adminLaboratorioId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
        laboratorioId: string;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        name: string;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
        twoFactorSecretEncrypted: string | null;
        twoFactorEnabled: boolean;
        lastLoginAt: Date | null;
        laboratorioId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
        laboratorioId: string;
    } | null>;
    findAll(laboratorioId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }[]>;
    toggleActive(id: string, active: boolean, laboratorioId: string): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
    }>;
}

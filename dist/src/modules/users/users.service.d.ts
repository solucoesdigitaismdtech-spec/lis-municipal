import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    private readonly logger;
    private readonly BCRYPT_ROUNDS;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto, adminLaboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        laboratorioId: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        laboratorioId: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        passwordHash: string;
        active: boolean;
        twoFactorSecretEncrypted: string | null;
        twoFactorEnabled: boolean;
        lastLoginAt: Date | null;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        laboratorioId: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
    } | null>;
    findAll(laboratorioId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
        lastLoginAt: Date | null;
    }[]>;
    toggleActive(id: string, active: boolean, laboratorioId: string): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
    }>;
}

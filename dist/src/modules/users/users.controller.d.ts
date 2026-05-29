import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, laboratorioId: string): Promise<{
        id: string;
        laboratorioId: string;
        createdAt: Date;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        active: boolean;
    }>;
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

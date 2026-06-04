# LIS API Fase 1 - Pacote corrigido

Este pacote foi ajustado para o schema Prisma atualizado e para Prisma 7.

## Dependencias

Use npm no Windows:

```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm install @prisma/adapter-pg pg
npm install -D @types/bcrypt @types/passport-jwt @types/passport-local @types/pg
```

## Campos ajustados para o schema novo

- `User.password` virou `User.passwordHash`.
- `RefreshToken.token` virou `RefreshToken.tokenHash`.
- `User.email` agora e unico por laboratorio: `@@unique([laboratorioId, email])`.
- `PrismaService` usa `@prisma/adapter-pg`, necessario no Prisma 7.

## Variaveis necessarias no .env

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/lis_municipal?schema=public"
JWT_SECRET="troque-por-uma-chave-grande"
JWT_REFRESH_SECRET="troque-por-outra-chave-grande"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
ENCRYPTION_KEY="gere-64-caracteres-hex"
PORT="3333"
NODE_ENV="development"
```

Gere a `ENCRYPTION_KEY` com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Seed manual corrigido

Gere o hash da senha:

```bash
node -e "const b=require('bcrypt');b.hash('Admin@123',12).then(console.log)"
```

SQL:

```sql
INSERT INTO laboratorios (id, nome, cnes, municipio, uf, ativo, "createdAt", "updatedAt")
VALUES ('lab_001', 'Laboratorio Municipal Teste', '1234567', 'Mae D''agua', 'PB', true, NOW(), NOW());

INSERT INTO users (id, name, email, "passwordHash", role, active, "laboratorioId", "createdAt", "updatedAt")
VALUES (
  'user_admin_001',
  'Administrador',
  'admin@lis.local',
  'COLE_O_HASH_AQUI',
  'ADMIN',
  true,
  'lab_001',
  NOW(),
  NOW()
);
```

## Teste

```bash
npm run start:dev
```

Login:

```http
POST http://localhost:3333/api/auth/login
Content-Type: application/json

{
  "email": "admin@lis.local",
  "password": "Admin@123"
}
```

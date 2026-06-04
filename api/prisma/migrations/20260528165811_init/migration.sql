-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BIOMEDICO', 'TECNICO');

-- CreateEnum
CREATE TYPE "PacienteOrigem" AS ENUM ('LOCAL', 'ESUS');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoUnidade" AS ENUM ('UBS', 'UPA', 'HOSPITAL', 'POSTO_SAUDE', 'LABORATORIO');

-- CreateEnum
CREATE TYPE "CategoriaExame" AS ENUM ('HEMATOLOGIA', 'BIOQUIMICA', 'URINANALISE', 'MICROBIOLOGIA', 'IMUNOLOGIA', 'HORMONIOS', 'SOROLOGIAS', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('ABERTA', 'EM_COLETA', 'EM_ANALISE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('AGUARDANDO_COLETA', 'COLETADO', 'EM_ANALISE', 'RESULTADO_DIGITADO', 'VALIDADO', 'LIBERADO');

-- CreateEnum
CREATE TYPE "StatusResult" AS ENUM ('RASCUNHO', 'DIGITADO', 'VALIDADO', 'ASSINADO');

-- CreateEnum
CREATE TYPE "StatusLaudo" AS ENUM ('GERANDO', 'GERADO', 'LIBERADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('NORMAL', 'URGENTE', 'CRITICO');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "StatusNotif" AS ENUM ('PENDENTE', 'ENVIADO', 'ERRO');

-- CreateTable
CREATE TABLE "laboratorios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnes" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "cnpj" TEXT,
    "responsavelTecnico" TEXT,
    "crbm" TEXT,
    "logoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecretEncrypted" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "laboratorioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esus_conexoes" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "hostEncrypted" TEXT NOT NULL,
    "usuarioEncrypted" TEXT NOT NULL,
    "senhaEncrypted" TEXT NOT NULL,
    "porta" INTEGER NOT NULL DEFAULT 5432,
    "banco" TEXT NOT NULL DEFAULT 'esus',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ultimoTesteEm" TIMESTAMP(3),
    "statusConexao" TEXT,
    "erroConexao" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esus_conexoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "cpfEncrypted" TEXT NOT NULL,
    "cns" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "nomeMaeEncrypted" TEXT,
    "telefoneEncrypted" TEXT,
    "whatsappEncrypted" TEXT,
    "emailEncrypted" TEXT,
    "enderecoEncrypted" JSONB,
    "fotoUrl" TEXT,
    "origem" "PacienteOrigem" NOT NULL DEFAULT 'LOCAL',
    "esusSnapshotId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes_esus_snapshot" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "dadosBrutos" JSONB NOT NULL,
    "hashIntegridade" TEXT NOT NULL,
    "buscadoPorId" TEXT NOT NULL,
    "ipBusca" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacientes_esus_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esus_access_logs" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cpfHashConsultado" TEXT NOT NULL,
    "encontrado" BOOLEAN NOT NULL,
    "duracaoMs" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esus_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_saude" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnes" TEXT,
    "endereco" TEXT,
    "tipo" "TipoUnidade" NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exames_catalogo" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigtap" TEXT,
    "metodo" TEXT,
    "material" TEXT NOT NULL,
    "categoria" "CategoriaExame" NOT NULL,
    "prazoHoras" INTEGER NOT NULL DEFAULT 24,
    "instrucoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exames_catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valores_referencia" (
    "id" TEXT NOT NULL,
    "exameId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "faixaIdade" TEXT,
    "sexo" "Sexo",
    "minimo" DOUBLE PRECISION,
    "maximo" DOUBLE PRECISION,
    "textoRef" TEXT,
    "unidade" TEXT NOT NULL,
    "critico" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valores_referencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "medicoSolicitante" TEXT,
    "status" "StatusOS" NOT NULL DEFAULT 'ABERTA',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'NORMAL',
    "observacoes" TEXT,
    "dataColeta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_ordem" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "exameId" TEXT NOT NULL,
    "status" "StatusItem" NOT NULL DEFAULT 'AGUARDANDO_COLETA',
    "coletadoEm" TIMESTAMP(3),
    "prazoEntrega" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_ordem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_exame" (
    "id" TEXT NOT NULL,
    "itemOrdemId" TEXT NOT NULL,
    "biomedicoId" TEXT NOT NULL,
    "valores" JSONB NOT NULL,
    "status" "StatusResult" NOT NULL DEFAULT 'RASCUNHO',
    "critico" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "parecerTecnico" TEXT,
    "assinadoEm" TIMESTAMP(3),
    "validadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultados_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laudos" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "hashAutenticacao" TEXT NOT NULL,
    "urlPdf" TEXT,
    "qrCodeUrl" TEXT,
    "status" "StatusLaudo" NOT NULL DEFAULT 'GERANDO',
    "liberadoEm" TIMESTAMP(3),
    "expiracaoUrl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "laudoId" TEXT NOT NULL,
    "canal" "Canal" NOT NULL,
    "destino" TEXT NOT NULL,
    "status" "StatusNotif" NOT NULL DEFAULT 'PENDENTE',
    "enviadoEm" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laboratorios_cnes_key" ON "laboratorios"("cnes");

-- CreateIndex
CREATE INDEX "users_laboratorioId_idx" ON "users"("laboratorioId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_laboratorioId_email_key" ON "users"("laboratorioId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "esus_conexoes_laboratorioId_key" ON "esus_conexoes"("laboratorioId");

-- CreateIndex
CREATE INDEX "esus_conexoes_criadoPorId_idx" ON "esus_conexoes"("criadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_esusSnapshotId_key" ON "pacientes"("esusSnapshotId");

-- CreateIndex
CREATE INDEX "pacientes_laboratorioId_idx" ON "pacientes"("laboratorioId");

-- CreateIndex
CREATE INDEX "pacientes_unidadeId_idx" ON "pacientes"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_laboratorioId_cpfHash_key" ON "pacientes"("laboratorioId", "cpfHash");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_laboratorioId_cns_key" ON "pacientes"("laboratorioId", "cns");

-- CreateIndex
CREATE INDEX "pacientes_esus_snapshot_laboratorioId_cpfHash_idx" ON "pacientes_esus_snapshot"("laboratorioId", "cpfHash");

-- CreateIndex
CREATE INDEX "pacientes_esus_snapshot_buscadoPorId_idx" ON "pacientes_esus_snapshot"("buscadoPorId");

-- CreateIndex
CREATE INDEX "esus_access_logs_laboratorioId_createdAt_idx" ON "esus_access_logs"("laboratorioId", "createdAt");

-- CreateIndex
CREATE INDEX "esus_access_logs_userId_idx" ON "esus_access_logs"("userId");

-- CreateIndex
CREATE INDEX "esus_access_logs_laboratorioId_cpfHashConsultado_idx" ON "esus_access_logs"("laboratorioId", "cpfHashConsultado");

-- CreateIndex
CREATE INDEX "unidades_saude_laboratorioId_idx" ON "unidades_saude"("laboratorioId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_saude_laboratorioId_cnes_key" ON "unidades_saude"("laboratorioId", "cnes");

-- CreateIndex
CREATE INDEX "exames_catalogo_laboratorioId_idx" ON "exames_catalogo"("laboratorioId");

-- CreateIndex
CREATE UNIQUE INDEX "exames_catalogo_laboratorioId_codigo_key" ON "exames_catalogo"("laboratorioId", "codigo");

-- CreateIndex
CREATE INDEX "valores_referencia_exameId_idx" ON "valores_referencia"("exameId");

-- CreateIndex
CREATE INDEX "ordens_servico_laboratorioId_status_idx" ON "ordens_servico"("laboratorioId", "status");

-- CreateIndex
CREATE INDEX "ordens_servico_pacienteId_idx" ON "ordens_servico"("pacienteId");

-- CreateIndex
CREATE INDEX "ordens_servico_unidadeId_idx" ON "ordens_servico"("unidadeId");

-- CreateIndex
CREATE INDEX "ordens_servico_solicitanteId_idx" ON "ordens_servico"("solicitanteId");

-- CreateIndex
CREATE INDEX "ordens_servico_createdAt_idx" ON "ordens_servico"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_laboratorioId_protocolo_key" ON "ordens_servico"("laboratorioId", "protocolo");

-- CreateIndex
CREATE INDEX "itens_ordem_ordemId_idx" ON "itens_ordem"("ordemId");

-- CreateIndex
CREATE INDEX "itens_ordem_exameId_idx" ON "itens_ordem"("exameId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_ordem_ordemId_exameId_key" ON "itens_ordem"("ordemId", "exameId");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_exame_itemOrdemId_key" ON "resultados_exame"("itemOrdemId");

-- CreateIndex
CREATE INDEX "resultados_exame_biomedicoId_idx" ON "resultados_exame"("biomedicoId");

-- CreateIndex
CREATE UNIQUE INDEX "laudos_ordemId_key" ON "laudos"("ordemId");

-- CreateIndex
CREATE UNIQUE INDEX "laudos_hashAutenticacao_key" ON "laudos"("hashAutenticacao");

-- CreateIndex
CREATE INDEX "notificacoes_laudoId_idx" ON "notificacoes"("laudoId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidadeId_idx" ON "audit_logs"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esus_conexoes" ADD CONSTRAINT "esus_conexoes_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esus_conexoes" ADD CONSTRAINT "esus_conexoes_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_esusSnapshotId_fkey" FOREIGN KEY ("esusSnapshotId") REFERENCES "pacientes_esus_snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes_esus_snapshot" ADD CONSTRAINT "pacientes_esus_snapshot_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes_esus_snapshot" ADD CONSTRAINT "pacientes_esus_snapshot_buscadoPorId_fkey" FOREIGN KEY ("buscadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esus_access_logs" ADD CONSTRAINT "esus_access_logs_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esus_access_logs" ADD CONSTRAINT "esus_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_saude" ADD CONSTRAINT "unidades_saude_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames_catalogo" ADD CONSTRAINT "exames_catalogo_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valores_referencia" ADD CONSTRAINT "valores_referencia_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "exames_catalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem" ADD CONSTRAINT "itens_ordem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem" ADD CONSTRAINT "itens_ordem_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "exames_catalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_exame" ADD CONSTRAINT "resultados_exame_itemOrdemId_fkey" FOREIGN KEY ("itemOrdemId") REFERENCES "itens_ordem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_exame" ADD CONSTRAINT "resultados_exame_biomedicoId_fkey" FOREIGN KEY ("biomedicoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laudos" ADD CONSTRAINT "laudos_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "laudos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

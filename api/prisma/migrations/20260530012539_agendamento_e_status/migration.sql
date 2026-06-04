-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusOS" ADD VALUE 'AGENDADA';
ALTER TYPE "StatusOS" ADD VALUE 'COLETA_REALIZADA';
ALTER TYPE "StatusOS" ADD VALUE 'EM_DIGITACAO';
ALTER TYPE "StatusOS" ADD VALUE 'LIBERADA';

-- AlterTable
ALTER TABLE "ordens_servico" ADD COLUMN     "dataAgendamento" TIMESTAMP(3);

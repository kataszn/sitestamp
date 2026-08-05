-- AlterEnum
ALTER TYPE "VisitStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "lastError" TEXT;

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAYE', 'NON_PAYE');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PAYE';

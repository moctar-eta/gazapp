/*
  Warnings:

  - You are about to drop the column `logoPath` on the `MerchantSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MerchantSettings" DROP COLUMN "logoPath";

-- CreateTable
CREATE TABLE "Discount" (
    "id" SERIAL NOT NULL,
    "buyerName" TEXT NOT NULL,
    "bottleType" "BottleType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Discount_buyerName_idx" ON "Discount"("buyerName");

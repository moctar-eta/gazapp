/*
  Warnings:

  - You are about to drop the `Discount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Discount";

-- CreateTable
CREATE TABLE "DiscountPrice" (
    "type" "BottleType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountPrice_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "DiscountSale" (
    "id" SERIAL NOT NULL,
    "buyerName" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountItem" (
    "id" SERIAL NOT NULL,
    "discountSaleId" INTEGER NOT NULL,
    "bottleType" "BottleType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DiscountItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountSale_buyerName_idx" ON "DiscountSale"("buyerName");

-- AddForeignKey
ALTER TABLE "DiscountItem" ADD CONSTRAINT "DiscountItem_discountSaleId_fkey" FOREIGN KEY ("discountSaleId") REFERENCES "DiscountSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

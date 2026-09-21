-- AlterTable
ALTER TABLE "DiscountSale" ADD COLUMN "invoiceNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DiscountSale_invoiceNumber_key" ON "DiscountSale"("invoiceNumber");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pickupSlotStart" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_pickupSlotStart_orderStatus_idx" ON "Order"("pickupSlotStart", "orderStatus");

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "allergenNote" TEXT,
ADD COLUMN     "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cuisines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mealTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "spiceLevel" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

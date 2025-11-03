-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "needCategory" TEXT,
ADD COLUMN     "riskCategory" TEXT,
ADD COLUMN     "scoreDetails" JSONB;

-- CreateEnum
CREATE TYPE "IncomeVerificationStatus" AS ENUM ('PENDING', 'AUTO_VERIFIED', 'MANUAL_REVIEW', 'UNNEEDED');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "abilityToRepayIndex" DOUBLE PRECISION,
ADD COLUMN     "incomeMismatchFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "incomeVerificationNotes" TEXT,
ADD COLUMN     "incomeVerificationStatus" "IncomeVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "partnerApplicationId" TEXT,
ADD COLUMN     "partnerMatchConfidence" DOUBLE PRECISION,
ADD COLUMN     "partnerVerifiedIncome" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "channel_partners" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "reliabilityScore" DOUBLE PRECISION DEFAULT 0,
    "coverageRatio" DOUBLE PRECISION DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_partner_applications" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "partnerBeneficiaryId" TEXT NOT NULL,
    "borrowerName" TEXT,
    "aadhaarNumber" TEXT,
    "panNumber" TEXT,
    "mobile" TEXT,
    "loanAmount" DOUBLE PRECISION,
    "tenureMonths" INTEGER,
    "interestRate" DOUBLE PRECISION,
    "principalOutstanding" DOUBLE PRECISION,
    "status" TEXT,
    "disbursedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "businessCategory" TEXT,
    "businessType" TEXT,
    "monthlyRevenue" DOUBLE PRECISION,
    "averageMonthlyRepayment" DOUBLE PRECISION,
    "onTimePaymentRate" DOUBLE PRECISION,
    "abilityToRepayIndex" DOUBLE PRECISION,
    "verifiedIncome" DOUBLE PRECISION,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "matchedUserId" TEXT,
    "matchedApplicationId" TEXT,
    "matchConfidence" DOUBLE PRECISION DEFAULT 0,
    "incomeMismatchFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "channel_partner_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_partner_repayments" (
    "id" TEXT NOT NULL,
    "partnerApplicationId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION,
    "daysLate" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_partner_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_partner_business_activity" (
    "id" TEXT NOT NULL,
    "partnerApplicationId" TEXT NOT NULL,
    "activityType" TEXT,
    "description" TEXT,
    "monthlyRevenue" DOUBLE PRECISION,
    "annualTurnover" DOUBLE PRECISION,
    "employeeCount" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_partner_business_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_partners_code_key" ON "channel_partners"("code");

-- CreateIndex
CREATE INDEX "channel_partners_lastSyncAt_idx" ON "channel_partners"("lastSyncAt");

-- CreateIndex
CREATE INDEX "channel_partner_applications_matchedUserId_idx" ON "channel_partner_applications"("matchedUserId");

-- CreateIndex
CREATE INDEX "channel_partner_applications_matchedApplicationId_idx" ON "channel_partner_applications"("matchedApplicationId");

-- CreateIndex
CREATE INDEX "channel_partner_applications_lastSyncedAt_idx" ON "channel_partner_applications"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "channel_partner_applications_partnerId_partnerBeneficiaryId_key" ON "channel_partner_applications"("partnerId", "partnerBeneficiaryId");

-- CreateIndex
CREATE INDEX "channel_partner_repayments_partnerApplicationId_idx" ON "channel_partner_repayments"("partnerApplicationId");

-- CreateIndex
CREATE INDEX "channel_partner_repayments_dueDate_idx" ON "channel_partner_repayments"("dueDate");

-- CreateIndex
CREATE INDEX "channel_partner_business_activity_partnerApplicationId_idx" ON "channel_partner_business_activity"("partnerApplicationId");

-- CreateIndex
CREATE INDEX "applications_incomeVerificationStatus_idx" ON "applications"("incomeVerificationStatus");

-- AddForeignKey
ALTER TABLE "channel_partner_applications" ADD CONSTRAINT "channel_partner_applications_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "channel_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_partner_applications" ADD CONSTRAINT "channel_partner_applications_matchedUserId_fkey" FOREIGN KEY ("matchedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_partner_applications" ADD CONSTRAINT "channel_partner_applications_matchedApplicationId_fkey" FOREIGN KEY ("matchedApplicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_partner_repayments" ADD CONSTRAINT "channel_partner_repayments_partnerApplicationId_fkey" FOREIGN KEY ("partnerApplicationId") REFERENCES "channel_partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_partner_business_activity" ADD CONSTRAINT "channel_partner_business_activity_partnerApplicationId_fkey" FOREIGN KEY ("partnerApplicationId") REFERENCES "channel_partner_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

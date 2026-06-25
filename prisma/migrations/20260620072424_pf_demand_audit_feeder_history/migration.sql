/*
  Warnings:

  - You are about to drop the column `month` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `connectedFeederId` on the `consumers` table. All the data in the column will be lost.
  - You are about to drop the column `energySuppliedKWh` on the `feeders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[consumerId,billingYear,billingMonth]` on the table `bills` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billingMonth` to the `bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billingYear` to the `bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feederId` to the `transformers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "consumers" DROP CONSTRAINT "consumers_connectedFeederId_fkey";

-- DropIndex
DROP INDEX "bills_consumerId_month_idx";

-- DropIndex
DROP INDEX "bills_consumerId_month_key";

-- DropIndex
DROP INDEX "consumers_connectedFeederId_idx";

-- AlterTable
ALTER TABLE "bills" DROP COLUMN "month",
ADD COLUMN     "billingMonth" INTEGER NOT NULL,
ADD COLUMN     "billingYear" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "consumers" DROP COLUMN "connectedFeederId";

-- AlterTable
ALTER TABLE "feeders" DROP COLUMN "energySuppliedKWh";

-- AlterTable
ALTER TABLE "transformers" ADD COLUMN     "currentLoadKVA" DOUBLE PRECISION,
ADD COLUMN     "feederId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "feeder_energy_readings" (
    "id" TEXT NOT NULL,
    "feederId" TEXT NOT NULL,
    "energySuppliedKWh" DOUBLE PRECISION NOT NULL,
    "energyBilledKWh" DOUBLE PRECISION,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feeder_energy_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_factor_readings" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "activePowerKW" DOUBLE PRECISION NOT NULL,
    "reactivePowerKVAR" DOUBLE PRECISION NOT NULL,
    "powerFactor" DOUBLE PRECISION NOT NULL,
    "penaltyAmount" DOUBLE PRECISION DEFAULT 0,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_factor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_readings" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "demandKW" DOUBLE PRECISION NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_audits" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "auditPeriodStart" TIMESTAMP(3) NOT NULL,
    "auditPeriodEnd" TIMESTAMP(3) NOT NULL,
    "totalConsumptionKWh" DOUBLE PRECISION NOT NULL,
    "peakDemandKW" DOUBLE PRECISION NOT NULL,
    "loadFactor" DOUBLE PRECISION NOT NULL,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feeder_energy_readings_feederId_readingDate_idx" ON "feeder_energy_readings"("feederId", "readingDate");

-- CreateIndex
CREATE UNIQUE INDEX "feeder_energy_readings_feederId_readingDate_key" ON "feeder_energy_readings"("feederId", "readingDate");

-- CreateIndex
CREATE INDEX "power_factor_readings_consumerId_readingDate_idx" ON "power_factor_readings"("consumerId", "readingDate");

-- CreateIndex
CREATE INDEX "demand_readings_consumerId_readingDate_idx" ON "demand_readings"("consumerId", "readingDate");

-- CreateIndex
CREATE INDEX "energy_audits_consumerId_auditPeriodStart_idx" ON "energy_audits"("consumerId", "auditPeriodStart");

-- CreateIndex
CREATE INDEX "bills_consumerId_billingYear_billingMonth_idx" ON "bills"("consumerId", "billingYear", "billingMonth");

-- CreateIndex
CREATE UNIQUE INDEX "bills_consumerId_billingYear_billingMonth_key" ON "bills"("consumerId", "billingYear", "billingMonth");

-- CreateIndex
CREATE INDEX "transformers_feederId_idx" ON "transformers"("feederId");

-- AddForeignKey
ALTER TABLE "feeder_energy_readings" ADD CONSTRAINT "feeder_energy_readings_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "feeders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformers" ADD CONSTRAINT "transformers_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "feeders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_factor_readings" ADD CONSTRAINT "power_factor_readings_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_readings" ADD CONSTRAINT "demand_readings_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_audits" ADD CONSTRAINT "energy_audits_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

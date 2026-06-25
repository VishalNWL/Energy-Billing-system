-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ENGINEER', 'CONSUMER');

-- CreateEnum
CREATE TYPE "ConsumerType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSUMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumers" (
    "id" TEXT NOT NULL,
    "consumerNumber" TEXT NOT NULL,
    "consumerType" "ConsumerType" NOT NULL,
    "address" TEXT NOT NULL,
    "sanctionedLoad" DOUBLE PRECISION NOT NULL,
    "contractedDemand" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "connectedTransformerId" TEXT,
    "connectedFeederId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meters" (
    "id" TEXT NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meter_readings" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "reading" DOUBLE PRECISION NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peakUnits" DOUBLE PRECISION,
    "dayUnits" DOUBLE PRECISION,
    "offPeakUnits" DOUBLE PRECISION,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meter_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "unitsConsumed" DOUBLE PRECISION NOT NULL,
    "energyCharge" DOUBLE PRECISION NOT NULL,
    "fixedCharge" DOUBLE PRECISION NOT NULL,
    "demandCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "powerFactorPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solarAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transformers" (
    "id" TEXT NOT NULL,
    "transformerName" TEXT NOT NULL,
    "capacityKVA" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transformers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feeders" (
    "id" TEXT NOT NULL,
    "feederName" TEXT NOT NULL,
    "capacityKW" DOUBLE PRECISION NOT NULL,
    "energySuppliedKWh" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solar_plants" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "installedCapacityKW" DOUBLE PRECISION NOT NULL,
    "generatedUnits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solar_plants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "consumers_consumerNumber_key" ON "consumers"("consumerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "consumers_userId_key" ON "consumers"("userId");

-- CreateIndex
CREATE INDEX "consumers_connectedTransformerId_idx" ON "consumers"("connectedTransformerId");

-- CreateIndex
CREATE INDEX "consumers_connectedFeederId_idx" ON "consumers"("connectedFeederId");

-- CreateIndex
CREATE UNIQUE INDEX "meters_meterNumber_key" ON "meters"("meterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "meters_consumerId_key" ON "meters"("consumerId");

-- CreateIndex
CREATE INDEX "meter_readings_meterId_readingDate_idx" ON "meter_readings"("meterId", "readingDate");

-- CreateIndex
CREATE INDEX "bills_consumerId_month_idx" ON "bills"("consumerId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "bills_consumerId_month_key" ON "bills"("consumerId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "transformers_transformerName_key" ON "transformers"("transformerName");

-- CreateIndex
CREATE UNIQUE INDEX "feeders_feederName_key" ON "feeders"("feederName");

-- CreateIndex
CREATE UNIQUE INDEX "solar_plants_consumerId_key" ON "solar_plants"("consumerId");

-- AddForeignKey
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_connectedTransformerId_fkey" FOREIGN KEY ("connectedTransformerId") REFERENCES "transformers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_connectedFeederId_fkey" FOREIGN KEY ("connectedFeederId") REFERENCES "feeders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solar_plants" ADD CONSTRAINT "solar_plants_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

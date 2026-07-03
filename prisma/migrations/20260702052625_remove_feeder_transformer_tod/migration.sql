/*
  Warnings:

  - You are about to drop the column `connectedTransformerId` on the `consumers` table. All the data in the column will be lost.
  - You are about to drop the `feeder_energy_readings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feeders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transformers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "consumers" DROP CONSTRAINT "consumers_connectedTransformerId_fkey";

-- DropForeignKey
ALTER TABLE "feeder_energy_readings" DROP CONSTRAINT "feeder_energy_readings_feederId_fkey";

-- DropForeignKey
ALTER TABLE "transformers" DROP CONSTRAINT "transformers_feederId_fkey";

-- DropIndex
DROP INDEX "consumers_connectedTransformerId_idx";

-- AlterTable
ALTER TABLE "consumers" DROP COLUMN "connectedTransformerId";

-- DropTable
DROP TABLE "feeder_energy_readings";

-- DropTable
DROP TABLE "feeders";

-- DropTable
DROP TABLE "transformers";

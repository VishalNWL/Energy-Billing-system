"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  calculateAuditScore,
  generateRecommendations,
} from "@/lib/electrical/energy-audit";

export async function getEnergyAuditOverview() {
  await requireRole(["ADMIN", "ENGINEER"]);

  const consumers = await prisma.consumer.findMany({
    include: {
      user: { select: { name: true } },
      bills: {
        select: {
          unitsConsumed: true,
          totalAmount: true,
          billingMonth: true,
          billingYear: true,
        },
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 12,
      },
      demandReadings: {
        select: { demandKW: true },
        orderBy: { readingDate: "desc" },
        take: 30,
      },
      powerFactorReadings: {
        select: { powerFactor: true },
        orderBy: { readingDate: "desc" },
        take: 10,
      },
      solarPlant: { select: { isActive: true } },
    },
    orderBy: { consumerNumber: "asc" },
  });

  return consumers.map((c) => {
    const totalUnits = c.bills.reduce((s, b) => s + b.unitsConsumed, 0);
    const avgMonthlyUnits =
      c.bills.length > 0 ? totalUnits / c.bills.length : 0;

    const demandValues = c.demandReadings.map((d) => d.demandKW);
    const maxDemand =
      demandValues.length > 0 ? Math.max(...demandValues) : 0;
    const avgDemand =
      demandValues.length > 0
        ? demandValues.reduce((a, b) => a + b, 0) / demandValues.length
        : 0;
    const loadFactor =
      maxDemand > 0
        ? parseFloat((avgDemand / maxDemand).toFixed(3))
        : 0;

    const avgPF =
      c.powerFactorReadings.length > 0
        ? parseFloat(
            (
              c.powerFactorReadings.reduce(
                (s, r) => s + r.powerFactor,
                0
              ) / c.powerFactorReadings.length
            ).toFixed(3)
          )
        : 1.0;

    const hasSolar = c.solarPlant?.isActive ?? false;
    const isWithinDemand =
      c.contractedDemand === null || maxDemand <= c.contractedDemand;

    const score = calculateAuditScore({
      loadFactor,
      avgPowerFactor: avgPF,
      hasSolar,
      isWithinContractedDemand: isWithinDemand,
      lossPercent: 0,
    });

    return {
      consumerId: c.id,
      consumerNumber: c.consumerNumber,
      consumerType: c.consumerType,
      name: c.user.name,
      avgMonthlyUnits: parseFloat(avgMonthlyUnits.toFixed(1)),
      maxDemand,
      loadFactor,
      avgPF,
      hasSolar,
      score,
    };
  });
}

export async function getConsumerEnergyAudit(consumerId: string) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      user: { select: { name: true, email: true } },
      bills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 12,
      },
      demandReadings: {
        orderBy: { readingDate: "desc" },
        take: 30,
      },
      powerFactorReadings: {
        orderBy: { readingDate: "desc" },
        take: 10,
      },
      solarPlant: true,
      meter: { select: { meterNumber: true } },
      transformer: {
        include: { feeder: { select: { feederName: true } } },
      },
    },
  });

  if (!consumer) return null;

  const MONTH_NAMES = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  // Consumption analysis
  const totalUnits = consumer.bills.reduce(
    (s, b) => s + b.unitsConsumed,
    0
  );
  const totalRevenue = consumer.bills.reduce(
    (s, b) => s + b.totalAmount,
    0
  );
  const avgMonthlyUnits =
    consumer.bills.length > 0 ? totalUnits / consumer.bills.length : 0;
  const avgMonthlyBill =
    consumer.bills.length > 0 ? totalRevenue / consumer.bills.length : 0;

  // Monthly consumption for chart
  const monthlyConsumption = [...consumer.bills]
    .reverse()
    .map((b) => ({
      month: `${MONTH_NAMES[b.billingMonth - 1]} ${b.billingYear}`,
      units: b.unitsConsumed,
      amount: b.totalAmount,
    }));

  // Demand analysis
  const demandValues = consumer.demandReadings.map((d) => d.demandKW);
  const maxDemandKW =
    demandValues.length > 0 ? Math.max(...demandValues) : 0;
  const avgDemandKW =
    demandValues.length > 0
      ? demandValues.reduce((a, b) => a + b, 0) / demandValues.length
      : 0;
  const loadFactor =
    maxDemandKW > 0
      ? parseFloat((avgDemandKW / maxDemandKW).toFixed(3))
      : 0;

  // Power factor analysis
  const avgPF =
    consumer.powerFactorReadings.length > 0
      ? parseFloat(
          (
            consumer.powerFactorReadings.reduce(
              (s, r) => s + r.powerFactor,
              0
            ) / consumer.powerFactorReadings.length
          ).toFixed(3)
        )
      : 1.0;

  const hasSolar = consumer.solarPlant?.isActive ?? false;
  const isWithinDemand =
    consumer.contractedDemand === null ||
    maxDemandKW <= consumer.contractedDemand;

  // Audit score
  const score = calculateAuditScore({
    loadFactor,
    avgPowerFactor: avgPF,
    hasSolar,
    isWithinContractedDemand: isWithinDemand,
    lossPercent: 0,
  });

  // Recommendations
  const recommendations = generateRecommendations({
    loadFactor,
    avgPowerFactor: avgPF,
    hasSolar,
    isWithinContractedDemand: isWithinDemand,
    consumerType: consumer.consumerType,
    peakDemandKW: maxDemandKW,
    avgMonthlyUnits,
  });

  // Save audit to DB
  await prisma.energyAudit.create({
    data: {
      consumerId,
      auditPeriodStart:
        consumer.bills.length > 0
          ? new Date(
              consumer.bills[consumer.bills.length - 1].billingYear,
              consumer.bills[consumer.bills.length - 1].billingMonth - 1,
              1
            )
          : new Date(),
      auditPeriodEnd: new Date(),
      totalConsumptionKWh: totalUnits,
      peakDemandKW: maxDemandKW,
      loadFactor,
      recommendations: JSON.stringify(
        recommendations.map((r) => r.title)
      ),
    },
  });

  return {
    consumer,
    totalUnits,
    totalRevenue,
    avgMonthlyUnits: parseFloat(avgMonthlyUnits.toFixed(1)),
    avgMonthlyBill: parseFloat(avgMonthlyBill.toFixed(2)),
    maxDemandKW,
    avgDemandKW: parseFloat(avgDemandKW.toFixed(2)),
    loadFactor,
    avgPF,
    hasSolar,
    isWithinDemand,
    monthlyConsumption,
    score,
    recommendations,
  };
}
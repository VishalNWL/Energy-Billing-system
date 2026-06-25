"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  solarRegistrationSchema,
  solarGenerationUpdateSchema,
} from "@/lib/validations/solar";
import { revalidatePath } from "next/cache";
import {
  calculateNetMetering,
  calculatePaybackPeriod,
  estimateSolarGeneration,
} from "@/lib/electrical/solar-net-metering";
import { TARIFF, ConsumerTypeTariff } from "@/lib/billing/tariff";

export async function registerSolarPlant(data: unknown) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = solarRegistrationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { consumerId, installedCapacityKW, installationDate } = parsed.data;

  // Check if solar plant already exists
  const existing = await prisma.solarPlant.findUnique({
    where: { consumerId },
  });

  if (existing) {
    return {
      success: false,
      errors: {
        consumerId: ["Solar plant already registered for this consumer."],
      },
    };
  }

  await prisma.solarPlant.create({
    data: {
      consumerId,
      installedCapacityKW,
      installationDate: new Date(installationDate),
      generatedUnits: 0,
      isActive: true,
    },
  });

  revalidatePath("/admin/solar");
  return { success: true };
}

export async function updateSolarGeneration(
  consumerId: string,
  data: unknown
) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = solarGenerationUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.solarPlant.update({
    where: { consumerId },
    data: { generatedUnits: parsed.data.generatedUnits },
  });

  revalidatePath(`/admin/solar/${consumerId}`);
  revalidatePath("/admin/solar");
  return { success: true };
}

export async function toggleSolarPlant(consumerId: string, isActive: boolean) {
  await requireRole(["ADMIN"]);

  await prisma.solarPlant.update({
    where: { consumerId },
    data: { isActive },
  });

  revalidatePath("/admin/solar");
  revalidatePath(`/admin/solar/${consumerId}`);
  return { success: true };
}

export async function getAllSolarPlants() {
  const plants = await prisma.solarPlant.findMany({
    include: {
      consumer: {
        include: {
          user: { select: { name: true } },
          bills: {
            orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return plants.map((plant) => {
    const consumer = plant.consumer;
    const latestBill = consumer.bills[0];
    const tariff = TARIFF[consumer.consumerType as ConsumerTypeTariff];

    const netMetering =
      latestBill
        ? calculateNetMetering(
            latestBill.unitsConsumed + plant.generatedUnits, // gross consumed
            plant.generatedUnits,
            consumer.consumerType as ConsumerTypeTariff,
            tariff.fixedCharge,
            tariff.taxRate
          )
        : null;

    const estimatedMonthlyGeneration = estimateSolarGeneration(
      plant.installedCapacityKW
    );

    return {
      plant,
      consumer,
      netMetering,
      estimatedMonthlyGeneration,
    };
  });
}

export async function getSolarPlantDetail(consumerId: string) {
  const plant = await prisma.solarPlant.findUnique({
    where: { consumerId },
    include: {
      consumer: {
        include: {
          user: { select: { name: true, email: true } },
          bills: {
            orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
            take: 12,
          },
          meter: { select: { meterNumber: true } },
        },
      },
    },
  });

  if (!plant) return null;

  const consumer = plant.consumer;
  const tariff = TARIFF[consumer.consumerType as ConsumerTypeTariff];

  // Build monthly net metering history from bills
  const MONTH_NAMES = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const monthlyHistory = consumer.bills.map((bill) => {
    const estimatedGen = estimateSolarGeneration(plant.installedCapacityKW);
    const grossUnits = bill.unitsConsumed + estimatedGen;

    const calc = calculateNetMetering(
      grossUnits,
      estimatedGen,
      consumer.consumerType as ConsumerTypeTariff,
      tariff.fixedCharge,
      tariff.taxRate
    );

    return {
      month: `${MONTH_NAMES[bill.billingMonth - 1]} ${bill.billingYear}`,
      consumedUnits: grossUnits,
      generatedUnits: estimatedGen,
      netUnits: calc.netUnits,
      grossBill: calc.grossBillAmount,
      netBill: calc.netBillAmount,
      savings: calc.solarAdjustment,
    };
  }).reverse();

  const totalSavings = monthlyHistory.reduce(
    (sum, m) => sum + m.savings,
    0
  );

  const estimatedMonthlyGeneration = estimateSolarGeneration(
    plant.installedCapacityKW
  );

  const payback = calculatePaybackPeriod(
    plant.installedCapacityKW,
    60000,
    monthlyHistory[0]?.savings ?? 0
  );

  return {
    plant,
    consumer,
    monthlyHistory,
    totalSavings,
    estimatedMonthlyGeneration,
    payback,
  };
}

export async function getConsumersWithoutSolar() {
  return prisma.consumer.findMany({
    where: { solarPlant: null },
    select: {
      id: true,
      consumerNumber: true,
      consumerType: true,
      sanctionedLoad: true,
      user: { select: { name: true } },
    },
    orderBy: { consumerNumber: "asc" },
  });
}
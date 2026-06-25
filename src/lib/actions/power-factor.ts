"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { powerFactorSchema } from "@/lib/validations/power-factor";
import { calculatePowerFactor, calculatePFPenaltyAmount } from "@/lib/electrical/power-factor";
import { revalidatePath } from "next/cache";

export async function addPowerFactorReading(
  consumerId: string,
  data: unknown
) {
  const currentUser = await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = powerFactorSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { activePowerKW, reactivePowerKVAR, readingDate } = parsed.data;

  const calc = calculatePowerFactor(activePowerKW, reactivePowerKVAR);

  // Estimate penalty amount based on a baseline energy charge
  // The actual penalty gets applied at billing time (Step 7 engine)
  const baselineEnergyCharge = activePowerKW * 6 * 30; // rough estimate
  const penaltyAmount = calculatePFPenaltyAmount(
    baselineEnergyCharge,
    calc.powerFactor
  );

  await prisma.powerFactorReading.create({
    data: {
      consumerId,
      activePowerKW,
      reactivePowerKVAR,
      powerFactor: calc.powerFactor,
      penaltyAmount,
      readingDate: new Date(readingDate),
      recordedBy: currentUser.id,
    },
  });

  revalidatePath(`/admin/power-factor/${consumerId}`);
  revalidatePath("/admin/power-factor");
  return { success: true };
}

export async function deletePowerFactorReading(
  readingId: string,
  consumerId: string
) {
  await requireRole(["ADMIN"]);
  await prisma.powerFactorReading.delete({ where: { id: readingId } });
  revalidatePath(`/admin/power-factor/${consumerId}`);
  return { success: true };
}

export async function getPFReadingsForConsumer(consumerId: string) {
  return prisma.powerFactorReading.findMany({
    where: { consumerId },
    orderBy: { readingDate: "desc" },
  });
}

export async function getAllLatestPFReadings() {
  // Get the latest PF reading per consumer
  const consumers = await prisma.consumer.findMany({
    include: {
      user: { select: { name: true } },
      powerFactorReadings: {
        orderBy: { readingDate: "desc" },
        take: 1,
      },
    },
    where: {
      powerFactorReadings: { some: {} },
    },
  });

  return consumers.map((c) => ({
    consumerId: c.id,
    consumerNumber: c.consumerNumber,
    consumerType: c.consumerType,
    name: c.user.name,
    latestReading: c.powerFactorReadings[0] ?? null,
  }));
}

export async function getConsumersForPF() {
  return prisma.consumer.findMany({
    select: {
      id: true,
      consumerNumber: true,
      consumerType: true,
      user: { select: { name: true } },
    },
    orderBy: { consumerNumber: "asc" },
  });
}
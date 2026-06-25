"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { feederEnergyReadingSchema } from "@/lib/validations/feeder-reading";
import {
  calculateFeederLoss,
  FeederLossResult,
} from "@/lib/electrical/feeder-loss";
import { revalidatePath } from "next/cache";

export async function addFeederEnergyReading(
  feederId: string,
  data: unknown
) {
  const currentUser = await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = feederEnergyReadingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { energySuppliedKWh, energyBilledKWh, readingDate } = parsed.data;

  // Check unique constraint: one reading per feeder per date
  const existing = await prisma.feederEnergyReading.findFirst({
    where: {
      feederId,
      readingDate: new Date(readingDate),
    },
  });

  if (existing) {
    return {
      success: false,
      errors: {
        readingDate: ["A reading already exists for this feeder on this date."],
      },
    };
  }

  await prisma.feederEnergyReading.create({
    data: {
      feederId,
      energySuppliedKWh,
      energyBilledKWh: energyBilledKWh ?? null,
      readingDate: new Date(readingDate),
      recordedBy: currentUser.id,
    },
  });

  revalidatePath(`/admin/feeders/${feederId}`);
  revalidatePath("/admin/feeders");
  return { success: true };
}

export async function getAllFeedersWithLoss(): Promise<FeederLossResult[]> {
  await requireRole(["ADMIN", "ENGINEER"]);

  const feeders = await prisma.feeder.findMany({
    include: {
      transformers: {
        include: {
          consumers: {
            include: {
              bills: {
                select: { unitsConsumed: true },
              },
            },
          },
        },
      },
      energyReadings: {
        orderBy: { readingDate: "desc" },
        take: 1,
      },
    },
    orderBy: { feederName: "asc" },
  });

  return feeders.map((feeder) => {
    // Compute total billed units for all consumers under this feeder
    // Feeder → Transformer → Consumer → Bill
    const energyBilledKWh = parseFloat(
      feeder.transformers
        .flatMap((t) => t.consumers)
        .flatMap((c) => c.bills)
        .reduce((sum, b) => sum + b.unitsConsumed, 0)
        .toFixed(2)
    );

    const latestReading = feeder.energyReadings[0];
    const energySuppliedKWh = latestReading?.energySuppliedKWh ?? 0;

    const { lossKWh, lossPercent, status } = calculateFeederLoss(
      energySuppliedKWh,
      energyBilledKWh
    );

    const consumerCount = feeder.transformers.flatMap(
      (t) => t.consumers
    ).length;

    return {
      feederId: feeder.id,
      feederName: feeder.feederName,
      capacityKW: feeder.capacityKW,
      energySuppliedKWh,
      energyBilledKWh,
      distributionLossKWh: lossKWh,
      lossPercent,
      status,
      transformerCount: feeder.transformers.length,
      consumerCount,
    };
  });
}

export async function getFeederDetail(feederId: string) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const feeder = await prisma.feeder.findUnique({
    where: { id: feederId },
    include: {
      transformers: {
        include: {
          consumers: {
            select: {
              id: true,
              consumerNumber: true,
              consumerType: true,
              sanctionedLoad: true,
              user: { select: { name: true } },
              bills: {
                select: {
                  unitsConsumed: true,
                  billingMonth: true,
                  billingYear: true,
                  totalAmount: true,
                },
              },
            },
          },
        },
      },
      energyReadings: {
        orderBy: { readingDate: "desc" },
        take: 12,
      },
    },
  });

  if (!feeder) return null;

  // Build historical loss trend from feeder energy readings
  const lossTrend = feeder.energyReadings.map((r) => {
    // Compute billed energy at the time of each reading (total lifetime)
    const totalBilled = feeder.transformers
      .flatMap((t) => t.consumers)
      .flatMap((c) => c.bills)
      .reduce((sum, b) => sum + b.unitsConsumed, 0);

    const { lossKWh, lossPercent, status } = calculateFeederLoss(
      r.energySuppliedKWh,
      r.energyBilledKWh ?? totalBilled
    );

    return {
      date: new Date(r.readingDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      supplied: r.energySuppliedKWh,
      billed: r.energyBilledKWh ?? totalBilled,
      loss: lossKWh,
      lossPercent,
      status,
    };
  }).reverse(); // chronological order

  return { feeder, lossTrend };
}
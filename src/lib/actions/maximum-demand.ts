"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { demandReadingSchema } from "@/lib/validations/demand-reading";
import { analyzeDemand, DemandConsumerType } from "@/lib/electrical/maximum-demand";
import { revalidatePath } from "next/cache";

export async function addDemandReading(consumerId: string, data: unknown) {
  const currentUser = await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = demandReadingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { demandKW, readingDate } = parsed.data;

  await prisma.demandReading.create({
    data: {
      consumerId,
      demandKW,
      readingDate: new Date(readingDate),
      recordedBy: currentUser.id,
    },
  });

  revalidatePath(`/admin/maximum-demand/${consumerId}`);
  revalidatePath("/admin/maximum-demand");
  return { success: true };
}

export async function deleteDemandReading(
  readingId: string,
  consumerId: string
) {
  await requireRole(["ADMIN"]);
  await prisma.demandReading.delete({ where: { id: readingId } });
  revalidatePath(`/admin/maximum-demand/${consumerId}`);
  return { success: true };
}

export async function getDemandAnalysisForConsumer(consumerId: string) {
  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      user: { select: { name: true } },
      demandReadings: {
        orderBy: { readingDate: "asc" },
      },
    },
  });

  if (!consumer) return null;

  const analysis = analyzeDemand(
    consumer.demandReadings,
    consumer.consumerType as DemandConsumerType,
    consumer.contractedDemand,
    consumerId
  );

  return { consumer, analysis };
}

export async function getAllConsumersDemandSummary() {
  const consumers = await prisma.consumer.findMany({
    include: {
      user: { select: { name: true } },
      demandReadings: {
        orderBy: { readingDate: "desc" },
        take: 30,
      },
    },
    where: {
      demandReadings: { some: {} },
    },
  });

  return consumers.map((c) => {
    const analysis = analyzeDemand(
      [...c.demandReadings].reverse(),
      c.consumerType as DemandConsumerType,
      c.contractedDemand,
      c.id
    );
    return {
      consumerId: c.id,
      consumerNumber: c.consumerNumber,
      consumerType: c.consumerType,
      name: c.user.name,
      contractedDemand: c.contractedDemand,
      maxDemandKW: analysis.maxDemandKW,
      loadFactor: analysis.loadFactor,
      isExceeding: analysis.isExceeding,
      demandCharge: analysis.demandCharge,
      readingCount: c.demandReadings.length,
    };
  });
}

export async function getConsumersForDemand() {
  return prisma.consumer.findMany({
    select: {
      id: true,
      consumerNumber: true,
      consumerType: true,
      contractedDemand: true,
      user: { select: { name: true } },
    },
    orderBy: { consumerNumber: "asc" },
  });
}
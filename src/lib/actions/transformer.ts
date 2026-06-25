"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  calculateTransformerLoading,
  TransformerLoadingResult,
} from "@/lib/electrical/transformer-loading";
import { revalidatePath } from "next/cache";

export async function getAllTransformersWithLoading() {
  await requireRole(["ADMIN", "ENGINEER"]);

  const transformers = await prisma.transformer.findMany({
    include: {
      feeder: { select: { id: true, feederName: true } },
      consumers: {
        select: {
          id: true,
          consumerNumber: true,
          consumerType: true,
          sanctionedLoad: true,
          contractedDemand: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { transformerName: "asc" },
  });

  return transformers.map((t) => calculateTransformerLoading(t));
}

export async function getTransformerDetail(transformerId: string) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const transformer = await prisma.transformer.findUnique({
    where: { id: transformerId },
    include: {
      feeder: true,
      consumers: {
        select: {
          id: true,
          consumerNumber: true,
          consumerType: true,
          sanctionedLoad: true,
          contractedDemand: true,
          user: { select: { name: true, email: true } },
          meter: { select: { meterNumber: true } },
          bills: {
            orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
            take: 1,
            select: { totalAmount: true, unitsConsumed: true },
          },
        },
      },
    },
  });

  if (!transformer) return null;

  const loading = calculateTransformerLoading(transformer);

  return { transformer, loading };
}

export async function updateTransformerCurrentLoad(
  transformerId: string,
  currentLoadKVA: number
) {
  await requireRole(["ADMIN", "ENGINEER"]);

  await prisma.transformer.update({
    where: { id: transformerId },
    data: { currentLoadKVA },
  });

  revalidatePath("/admin/transformers");
  revalidatePath(`/admin/transformers/${transformerId}`);
  return { success: true };
}
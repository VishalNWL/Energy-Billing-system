"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { consumerSchema } from "@/lib/validations/consumer";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

// ─── CREATE ──────────────────────────────────────

export async function createConsumer(data: unknown) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = consumerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    name,
    email,
    consumerNumber,
    consumerType,
    address,
    sanctionedLoad,
    contractedDemand,
    connectedTransformerId,
    meterNumber,
  } = parsed.data;

  // Check for duplicate consumer number or meter number
  const [existingConsumer, existingMeter] = await Promise.all([
    prisma.consumer.findUnique({ where: { consumerNumber } }),
    prisma.meter.findUnique({ where: { meterNumber } }),
  ]);

  if (existingConsumer) {
    return {
      success: false,
      errors: { consumerNumber: ["Consumer number already exists"] },
    };
  }

  if (existingMeter) {
    return {
      success: false,
      errors: { meterNumber: ["Meter number already exists"] },
    };
  }

  // Check if a User already exists with this email in our DB
  let dbUser = await prisma.user.findUnique({ where: { email } });

  if (!dbUser) {
    // Create a Clerk user first, then our DB User will be created via webhook
    // For immediate consistency, we create the DB user directly here
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      emailAddress: [email],
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" ") || undefined,
      skipPasswordRequirement: true,
    });

    // Sync publicMetadata role
    await client.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: { role: "CONSUMER" },
    });

    dbUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        name,
        email,
        role: "CONSUMER",
      },
    });
  }

  // Create Consumer + Meter in a transaction
  const consumer = await prisma.$transaction(async (tx) => {
    const newConsumer = await tx.consumer.create({
      data: {
        consumerNumber,
        consumerType,
        address,
        sanctionedLoad,
        contractedDemand: contractedDemand ?? null,
        connectedTransformerId: connectedTransformerId || null,
        userId: dbUser!.id,
      },
    });

    await tx.meter.create({
      data: {
        meterNumber,
        consumerId: newConsumer.id,
      },
    });

    return newConsumer;
  });

  revalidatePath("/admin/consumers");
  return { success: true, consumerId: consumer.id };
}

// ─── UPDATE ──────────────────────────────────────

export async function updateConsumer(consumerId: string, data: unknown) {
  await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = consumerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const {
    consumerNumber,
    consumerType,
    address,
    sanctionedLoad,
    contractedDemand,
    connectedTransformerId,
    meterNumber,
  } = parsed.data;

  // Check duplicates excluding self
  const [duplicateConsumer, duplicateMeter] = await Promise.all([
    prisma.consumer.findFirst({
      where: { consumerNumber, NOT: { id: consumerId } },
    }),
    prisma.meter.findFirst({
      where: { meterNumber, NOT: { consumerId } },
    }),
  ]);

  if (duplicateConsumer) {
    return {
      success: false,
      errors: { consumerNumber: ["Consumer number already exists"] },
    };
  }

  if (duplicateMeter) {
    return {
      success: false,
      errors: { meterNumber: ["Meter number already exists"] },
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.consumer.update({
      where: { id: consumerId },
      data: {
        consumerNumber,
        consumerType,
        address,
        sanctionedLoad,
        contractedDemand: contractedDemand ?? null,
        connectedTransformerId: connectedTransformerId || null,
      },
    });

    await tx.meter.update({
      where: { consumerId },
      data: { meterNumber },
    });
  });

  revalidatePath("/admin/consumers");
  revalidatePath(`/admin/consumers/${consumerId}`);
  return { success: true };
}

// ─── DELETE ──────────────────────────────────────

export async function deleteConsumer(consumerId: string) {
  await requireRole(["ADMIN"]);

  // Cascade in schema handles Meter, Bills, etc.
  await prisma.consumer.delete({ where: { id: consumerId } });

  revalidatePath("/admin/consumers");
  return { success: true };
}

// ─── QUERIES ─────────────────────────────────────

export async function getConsumers() {
  return prisma.consumer.findMany({
    include: {
      user: { select: { name: true, email: true } },
      meter: { select: { meterNumber: true } },
      transformer: {
        select: {
          transformerName: true,
          feeder: { select: { feederName: true } },
        },
      },
      _count: { select: { bills: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getConsumerById(id: string) {
  return prisma.consumer.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      meter: true,
      transformer: {
        include: { feeder: true },
      },
      solarPlant: true,
      bills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 6,
      },
      _count: { select: { bills: true, demandReadings: true } },
    },
  });
}
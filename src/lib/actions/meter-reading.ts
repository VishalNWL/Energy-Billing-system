"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { meterReadingSchema } from "@/lib/validations/meter-reading";
import { revalidatePath } from "next/cache";

// ─── ADD READING ──────────────────────────────────────

export async function addMeterReading(consumerId: string, data: unknown) {
  const currentUser = await requireRole(["ADMIN", "ENGINEER"]);

  const parsed = meterReadingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { reading, readingDate, peakUnits, dayUnits, offPeakUnits } = parsed.data;

  // Get the consumer's meter
  const meter = await prisma.meter.findUnique({
    where: { consumerId },
    include: {
      readings: {
        orderBy: { readingDate: "desc" },
        take: 1,
      },
    },
  });

  if (!meter) {
    return { success: false, errors: { reading: ["No meter found for this consumer"] } };
  }

  // Validate: new reading must be >= previous reading (meters only go forward)
  const previousReading = meter.readings[0];
  if (previousReading && reading < previousReading.reading) {
    return {
      success: false,
      errors: {
        reading: [
          `Reading must be ≥ previous reading of ${previousReading.reading} kWh`,
        ],
      },
    };
  }

  // Validate: reading date must be after previous reading date
  if (previousReading) {
    const prevDate = new Date(previousReading.readingDate);
    const newDate = new Date(readingDate);
    if (newDate <= prevDate) {
      return {
        success: false,
        errors: {
          readingDate: [
            `Date must be after previous reading date (${prevDate.toLocaleDateString("en-IN")})`,
          ],
        },
      };
    }
  }

  const newReading = await prisma.meterReading.create({
    data: {
      meterId: meter.id,
      reading,
      readingDate: new Date(readingDate),
      peakUnits: peakUnits ?? null,
      dayUnits: dayUnits ?? null,
      offPeakUnits: offPeakUnits ?? null,
      recordedBy: currentUser.id,
    },
  });

  revalidatePath(`/admin/meter-readings/${consumerId}`);
  revalidatePath("/admin/meter-readings");
  return { success: true, readingId: newReading.id };
}

// ─── DELETE READING ──────────────────────────────────────

export async function deleteMeterReading(readingId: string, consumerId: string) {
  await requireRole(["ADMIN"]);

  await prisma.meterReading.delete({ where: { id: readingId } });

  revalidatePath(`/admin/meter-readings/${consumerId}`);
  revalidatePath("/admin/meter-readings");
  return { success: true };
}

// ─── QUERIES ─────────────────────────────────────────────

export async function getReadingsForConsumer(consumerId: string) {
  const meter = await prisma.meter.findUnique({
    where: { consumerId },
    include: {
      readings: {
        orderBy: { readingDate: "desc" },
        include: {
          meter: {
            include: {
              consumer: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
      },
      consumer: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!meter) return null;

  // Compute delta (units consumed) for each reading pair
  const readings = meter.readings.map((reading, index) => {
    const nextReading = meter.readings[index + 1]; // older reading (desc order)
    const unitsConsumed = nextReading
      ? parseFloat((reading.reading - nextReading.reading).toFixed(2))
      : null; // first ever reading has no delta

    return { ...reading, unitsConsumed };
  });

  return { meter, readings, consumer: meter.consumer };
}

export async function getAllRecentReadings() {
  const readings = await prisma.meterReading.findMany({
    orderBy: { readingDate: "desc" },
    take: 50,
    include: {
      meter: {
        include: {
          consumer: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  return readings;
}

export async function getLatestReadingForConsumer(consumerId: string) {
  const meter = await prisma.meter.findUnique({ where: { consumerId } });
  if (!meter) return null;

  const readings = await prisma.meterReading.findMany({
    where: { meterId: meter.id },
    orderBy: { readingDate: "desc" },
    take: 2,
  });

  const current = readings[0] ?? null;
  const previous = readings[1] ?? null;
  const unitsConsumed =
    current && previous
      ? parseFloat((current.reading - previous.reading).toFixed(2))
      : null;

  return { current, previous, unitsConsumed, meterId: meter.id };
}
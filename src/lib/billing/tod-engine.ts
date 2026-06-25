import { prisma } from "@/lib/prisma";
import {
  calculateTodBill,
  TOD_FIXED_CHARGE,
  TodBillBreakdown,
} from "./tod-tariff";

export type TodBillingResult =
  | { success: true; breakdown: TodBillBreakdown }
  | { success: false; error: string };

export async function generateTodBill(
  consumerId: string,
  billingMonth: number,
  billingYear: number
): Promise<TodBillingResult> {
  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      meter: {
        include: {
          readings: {
            orderBy: { readingDate: "asc" },
            where: {
              // only readings within this billing month
              readingDate: {
                gte: new Date(billingYear, billingMonth - 1, 1),
                lte: new Date(billingYear, billingMonth, 0, 23, 59, 59),
              },
            },
          },
        },
      },
    },
  });

  if (!consumer || !consumer.meter) {
    return { success: false, error: "Consumer or meter not found." };
  }

  const readings = consumer.meter.readings;

  if (readings.length === 0) {
    return {
      success: false,
      error: `No readings found for ${billingMonth}/${billingYear}.`,
    };
  }

  // Check if ToD data is present on any reading
  const todReadings = readings.filter(
    (r) =>
      r.dayUnits !== null ||
      r.peakUnits !== null ||
      r.offPeakUnits !== null
  );

  const hasCompleteTodData = todReadings.length > 0;

  // Aggregate ToD units across all readings in the month
  const dayUnits = parseFloat(
    readings
      .reduce((sum, r) => sum + (r.dayUnits ?? 0), 0)
      .toFixed(2)
  );
  const peakUnits = parseFloat(
    readings
      .reduce((sum, r) => sum + (r.peakUnits ?? 0), 0)
      .toFixed(2)
  );
  const offPeakUnits = parseFloat(
    readings
      .reduce((sum, r) => sum + (r.offPeakUnits ?? 0), 0)
      .toFixed(2)
  );
  const totalUnits = parseFloat(
    (dayUnits + peakUnits + offPeakUnits).toFixed(2)
  );

  if (totalUnits === 0) {
    return {
      success: false,
      error:
        "No ToD unit data found. Please ensure meter readings include day/peak/off-peak breakdowns.",
    };
  }

  const consumerType =
    consumer.consumerType as keyof typeof TOD_FIXED_CHARGE;

  const charges = calculateTodBill(
    dayUnits,
    peakUnits,
    offPeakUnits,
    consumerType
  );

  const breakdown: TodBillBreakdown = {
    consumerId,
    consumerNumber: consumer.consumerNumber,
    consumerType: consumer.consumerType,
    billingMonth,
    billingYear,
    dayUnits,
    peakUnits,
    offPeakUnits,
    totalUnits,
    ...charges,
    readingsUsed: readings.length,
    hasCompleteTodData,
  };

  return { success: true, breakdown };
}

export async function getConsumersWithTodReadings() {
  const meters = await prisma.meter.findMany({
    where: {
      readings: {
        some: {
          OR: [
            { dayUnits: { not: null } },
            { peakUnits: { not: null } },
            { offPeakUnits: { not: null } },
          ],
        },
      },
    },
    include: {
      consumer: {
        include: { user: { select: { name: true } } },
      },
      readings: {
        where: {
          OR: [
            { dayUnits: { not: null } },
            { peakUnits: { not: null } },
            { offPeakUnits: { not: null } },
          ],
        },
        orderBy: { readingDate: "desc" },
        take: 1,
      },
    },
  });

  return meters.map((m) => ({
    consumerId: m.consumer.id,
    consumerNumber: m.consumer.consumerNumber,
    consumerType: m.consumer.consumerType,
    name: m.consumer.user.name,
    lastTodReading: m.readings[0]?.readingDate ?? null,
  }));
}
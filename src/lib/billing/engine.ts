import { prisma } from "@/lib/prisma";
import {
  TARIFF,
  calculateSlabEnergy,
  PF_THRESHOLD,
  PF_PENALTY_RATE,
  ConsumerTypeTariff,
} from "./tariff";

export interface BillBreakdown {
  consumerNumber: string;
  consumerType: ConsumerTypeTariff;
  billingMonth: number;
  billingYear: number;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  grossUnits: number; // before solar deduction
  solarGenerated: number;
  fixedCharge: number;
  energyCharge: number;
  demandCharge: number;
  powerFactorPenalty: number;
  solarAdjustment: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export type BillingError =
  | "CONSUMER_NOT_FOUND"
  | "METER_NOT_FOUND"
  | "INSUFFICIENT_READINGS"
  | "BILL_ALREADY_EXISTS"
  | "READING_DATE_MISMATCH";

export type BillingResult =
  | { success: true; bill: BillBreakdown & { id: string } }
  | { success: false; error: BillingError; message: string };

export async function generateBill(
  consumerId: string,
  billingMonth: number,
  billingYear: number
): Promise<BillingResult> {

  // ── 1. Fetch consumer with all needed relations ──
  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      meter: {
        include: {
          readings: {
            orderBy: { readingDate: "asc" },
          },
        },
      },
      solarPlant: true,
    },
  });

  if (!consumer) {
    return { success: false, error: "CONSUMER_NOT_FOUND", message: "Consumer not found." };
  }

  if (!consumer.meter) {
    return { success: false, error: "METER_NOT_FOUND", message: "No meter assigned to this consumer." };
  }

  // ── 2. Check for duplicate bill ──
  const existingBill = await prisma.bill.findUnique({
    where: {
      consumerId_billingYear_billingMonth: {
        consumerId,
        billingYear,
        billingMonth,
      },
    },
  });

  if (existingBill) {
    return {
      success: false,
      error: "BILL_ALREADY_EXISTS",
      message: `Bill for ${billingMonth}/${billingYear} already exists.`,
    };
  }

  // ── 3. Find the two readings that bracket this billing month ──
  // Strategy: find the latest reading ON OR BEFORE end of billing month
  // and the reading immediately before it
  const billingMonthEnd = new Date(billingYear, billingMonth, 0, 23, 59, 59); // last day of month
  const billingMonthStart = new Date(billingYear, billingMonth - 1, 1); // first day of month

  const allReadings = consumer.meter.readings;

  if (allReadings.length < 2) {
    return {
      success: false,
      error: "INSUFFICIENT_READINGS",
      message: "At least 2 meter readings are required to generate a bill.",
    };
  }

  // Get readings up to end of billing month
  const readingsUpToMonth = allReadings.filter(
    (r) => new Date(r.readingDate) <= billingMonthEnd
  );

  if (readingsUpToMonth.length < 2) {
    return {
      success: false,
      error: "INSUFFICIENT_READINGS",
      message: `Not enough readings found before end of ${billingMonth}/${billingYear}.`,
    };
  }

  const currentReading = readingsUpToMonth[readingsUpToMonth.length - 1];
  const previousReading = readingsUpToMonth[readingsUpToMonth.length - 2];

  // ── 4. Calculate units consumed ──
  const grossUnits = parseFloat(
    (currentReading.reading - previousReading.reading).toFixed(2)
  );

  if (grossUnits < 0) {
    return {
      success: false,
      error: "READING_DATE_MISMATCH",
      message: "Current reading is less than previous reading.",
    };
  }

  // ── 5. Solar net-metering deduction ──
  const solarGenerated = consumer.solarPlant?.isActive
    ? consumer.solarPlant.generatedUnits
    : 0;

  const netUnits = Math.max(0, grossUnits - solarGenerated);
  const solarAdjustment = solarGenerated > 0
    ? parseFloat(
        (
          calculateSlabEnergy(grossUnits, consumer.consumerType as ConsumerTypeTariff) -
          calculateSlabEnergy(netUnits, consumer.consumerType as ConsumerTypeTariff)
        ).toFixed(2)
      )
    : 0;

  // ── 6. Apply tariff ──
  const tariff = TARIFF[consumer.consumerType as ConsumerTypeTariff];
  const fixedCharge = tariff.fixedCharge;
  const energyCharge = calculateSlabEnergy(netUnits, consumer.consumerType as ConsumerTypeTariff);

  // ── 7. Demand charge (COMMERCIAL / INDUSTRIAL only) ──
  let demandCharge = 0;
  if (consumer.contractedDemand && tariff.demandCharge > 0) {
    demandCharge = parseFloat(
      (consumer.contractedDemand * tariff.demandCharge).toFixed(2)
    );
  }

  // ── 8. Power factor penalty ──
  // Fetch the latest PF reading for this consumer this month
  let powerFactorPenalty = 0;
  const latestPFReading = await prisma.powerFactorReading.findFirst({
    where: {
      consumerId,
      readingDate: {
        gte: billingMonthStart,
        lte: billingMonthEnd,
      },
    },
    orderBy: { readingDate: "desc" },
  });

  if (latestPFReading && latestPFReading.powerFactor < PF_THRESHOLD) {
    const pfDrop = parseFloat(
      (PF_THRESHOLD - latestPFReading.powerFactor).toFixed(4)
    );
    const penaltySteps = Math.floor(pfDrop / 0.01);
    powerFactorPenalty = parseFloat(
      (energyCharge * PF_PENALTY_RATE * penaltySteps).toFixed(2)
    );
  }

  // ── 9. Tax ──
  const subtotal = fixedCharge + energyCharge + demandCharge + powerFactorPenalty - solarAdjustment;
  const taxAmount = parseFloat((subtotal * tariff.taxRate).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  // ── 10. Write bill to DB ──
  const dueDate = new Date(billingYear, billingMonth, 15); // 15th of next month

  const bill = await prisma.bill.create({
    data: {
      consumerId,
      billingMonth,
      billingYear,
      unitsConsumed: netUnits,
      energyCharge,
      fixedCharge,
      demandCharge,
      powerFactorPenalty,
      solarAdjustment,
      taxAmount,
      totalAmount,
      status: "PENDING",
      dueDate,
    },
  });

  const breakdown: BillBreakdown & { id: string } = {
    id: bill.id,
    consumerNumber: consumer.consumerNumber,
    consumerType: consumer.consumerType as ConsumerTypeTariff,
    billingMonth,
    billingYear,
    previousReading: previousReading.reading,
    currentReading: currentReading.reading,
    unitsConsumed: netUnits,
    grossUnits,
    solarGenerated,
    fixedCharge,
    energyCharge,
    demandCharge,
    powerFactorPenalty,
    solarAdjustment,
    subtotal,
    taxAmount,
    totalAmount,
  };

  return { success: true, bill: breakdown };
}

// ── Bulk generate for all consumers ──
export async function generateBillsForAllConsumers(
  billingMonth: number,
  billingYear: number
) {
  const consumers = await prisma.consumer.findMany({
    select: { id: true, consumerNumber: true },
  });

  const results = await Promise.allSettled(
    consumers.map((c) => generateBill(c.id, billingMonth, billingYear))
  );

  const summary = {
    total: consumers.length,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [] as { consumerNumber: string; error: string }[],
  };

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      if (result.value.success) {
        summary.success++;
      } else {
        if (result.value.error === "BILL_ALREADY_EXISTS") {
          summary.skipped++;
        } else {
          summary.failed++;
          summary.errors.push({
            consumerNumber: consumers[index].consumerNumber,
            error: result.value.message,
          });
        }
      }
    } else {
      summary.failed++;
      summary.errors.push({
        consumerNumber: consumers[index].consumerNumber,
        error: result.reason?.message ?? "Unknown error",
      });
    }
  });

  return summary;
}
import { prisma } from "@/lib/prisma";

export interface DailyLoadPoint {
  date: string;
  units: number;
  peakUnits: number | null;
  dayUnits: number | null;
  offPeakUnits: number | null;
}

export interface WeeklyLoadPoint {
  week: string;
  units: number;
}

export interface MonthlyLoadPoint {
  month: string;
  units: number;
  revenue: number;
}

export interface PeakInfo {
  date: string;
  units: number;
  type: "daily";
}

export async function getLoadAnalysisData(consumerId: string) {
  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      user: { select: { name: true } },
      bills: {
        orderBy: [{ billingYear: "asc" }, { billingMonth: "asc" }],
      },
      meter: {
        include: {
          readings: {
            orderBy: { readingDate: "asc" },
          },
        },
      },
    },
  });

  if (!consumer) return null;

  const MONTH_NAMES = [
    "Jan","Feb","Mar","Apr","May",
    "Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const readings = consumer.meter?.readings ?? [];
  const monthlyLoad: MonthlyLoadPoint[] = consumer.bills.map((b) => ({
    month: `${MONTH_NAMES[b.billingMonth - 1]} ${b.billingYear}`,
    units: b.unitsConsumed,
    revenue: b.totalAmount,
  }));

  if (!consumer.meter || readings.length < 2) {
    return {
      consumer,
      meterNumber: consumer.meter?.meterNumber ?? "Not assigned",
      dailyLoad: [],
      weeklyLoad: [],
      monthlyLoad: monthlyLoad.slice(-12),
      peak: null,
      totalReadings: readings.length,
      sanctionedLoad: consumer.sanctionedLoad,
    };
  }

  // ── Compute daily deltas ──
  const dailyDeltas: DailyLoadPoint[] = [];

  for (let i = 1; i < readings.length; i++) {
    const current = readings[i];
    const previous = readings[i - 1];

    const units = parseFloat(
      (current.reading - previous.reading).toFixed(2)
    );

    if (units < 0) continue; // skip bad readings

    dailyDeltas.push({
      date: new Date(current.readingDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      units,
      peakUnits: current.peakUnits,
      dayUnits: current.dayUnits,
      offPeakUnits: current.offPeakUnits,
    });
  }

  // ── Weekly aggregation ──
  const weeklyMap = new Map<string, number>();

  for (let i = 1; i < readings.length; i++) {
    const current = readings[i];
    const previous = readings[i - 1];
    const units = parseFloat(
      (current.reading - previous.reading).toFixed(2)
    );
    if (units < 0) continue;

    const date = new Date(current.readingDate);
    // ISO week number
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((date.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
        7
    );
    const key = `W${weekNum} ${date.getFullYear()}`;
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + units);
  }

  const weeklyLoad: WeeklyLoadPoint[] = Array.from(weeklyMap.entries()).map(
    ([week, units]) => ({ week, units: parseFloat(units.toFixed(2)) })
  );

  // ── Peak detection ──
  let peak: PeakInfo | null = null;
  if (dailyDeltas.length > 0) {
    const maxPoint = dailyDeltas.reduce((max, point) =>
      point.units > max.units ? point : max
    );
    peak = { date: maxPoint.date, units: maxPoint.units, type: "daily" };
  }

  return {
    consumer,
    meterNumber: consumer.meter.meterNumber,
    dailyLoad: dailyDeltas.slice(-30), // last 30 data points
    weeklyLoad: weeklyLoad.slice(-12), // last 12 weeks
    monthlyLoad: monthlyLoad.slice(-12), // last 12 months
    peak,
    totalReadings: readings.length,
    sanctionedLoad: consumer.sanctionedLoad,
  };
}

export async function getAllConsumersForLoadAnalysis() {
  return prisma.consumer.findMany({
    select: {
      id: true,
      consumerNumber: true,
      consumerType: true,
      sanctionedLoad: true,
      user: { select: { name: true } },
      meter: {
        select: {
          _count: { select: { readings: true } },
        },
      },
    },
    orderBy: { consumerNumber: "asc" },
  });
}
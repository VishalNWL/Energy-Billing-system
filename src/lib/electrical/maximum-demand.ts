export const DEMAND_RATE = {
  RESIDENTIAL: 0,    // no demand charge for residential
  COMMERCIAL: 150,   // ₹/kVA/month
  INDUSTRIAL: 200,   // ₹/kVA/month
} as const;

export type DemandConsumerType = keyof typeof DEMAND_RATE;

export interface DemandAnalysis {
  consumerId: string;
  consumerType: DemandConsumerType;
  contractedDemandKW: number | null;
  readings: DemandReadingPoint[];
  maxDemandKW: number;
  avgDemandKW: number;
  minDemandKW: number;
  loadFactor: number;
  demandCharge: number;
  excessDemandKW: number;
  excessDemandPenalty: number;
  isExceeding: boolean;
}

export interface DemandReadingPoint {
  id: string;
  date: string;
  demandKW: number;
  isMax: boolean;
  exceedsContract: boolean;
}

export function analyzeDemand(
  readings: { id: string; demandKW: number; readingDate: Date }[],
  consumerType: DemandConsumerType,
  contractedDemandKW: number | null,
  consumerId: string
): DemandAnalysis {
  if (readings.length === 0) {
    return {
      consumerId,
      consumerType,
      contractedDemandKW,
      readings: [],
      maxDemandKW: 0,
      avgDemandKW: 0,
      minDemandKW: 0,
      loadFactor: 0,
      demandCharge: 0,
      excessDemandKW: 0,
      excessDemandPenalty: 0,
      isExceeding: false,
    };
  }

  const values = readings.map((r) => r.demandKW);
  const maxDemandKW = parseFloat(Math.max(...values).toFixed(2));
  const minDemandKW = parseFloat(Math.min(...values).toFixed(2));
  const avgDemandKW = parseFloat(
    (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
  );
  const loadFactor =
    maxDemandKW > 0
      ? parseFloat((avgDemandKW / maxDemandKW).toFixed(3))
      : 0;

  // Demand charge based on max demand
  // Convert kW to kVA assuming avg PF of 0.9 for calculation
  const maxDemandKVA = parseFloat((maxDemandKW / 0.9).toFixed(2));
  const demandCharge = parseFloat(
    (maxDemandKVA * DEMAND_RATE[consumerType]).toFixed(2)
  );

  // Excess demand
  const excessDemandKW =
    contractedDemandKW && maxDemandKW > contractedDemandKW
      ? parseFloat((maxDemandKW - contractedDemandKW).toFixed(2))
      : 0;

  // Excess demand penalty = 2× normal rate for excess units
  const excessDemandKVA = parseFloat((excessDemandKW / 0.9).toFixed(2));
  const excessDemandPenalty = parseFloat(
    (excessDemandKVA * DEMAND_RATE[consumerType] * 2).toFixed(2)
  );

  const isExceeding = excessDemandKW > 0;

  const demandPoints: DemandReadingPoint[] = readings.map((r) => ({
    id: r.id,
    date: new Date(r.readingDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    demandKW: r.demandKW,
    isMax: r.demandKW === maxDemandKW,
    exceedsContract:
      contractedDemandKW !== null && r.demandKW > contractedDemandKW,
  }));

  return {
    consumerId,
    consumerType,
    contractedDemandKW,
    readings: demandPoints,
    maxDemandKW,
    avgDemandKW,
    minDemandKW,
    loadFactor,
    demandCharge,
    excessDemandKW,
    excessDemandPenalty,
    isExceeding,
  };
}
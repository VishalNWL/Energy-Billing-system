// Tariff rates as of current configuration
// These can be moved to DB/env later for admin-configurable tariffs

export const TARIFF = {
  RESIDENTIAL: {
    fixedCharge: 100, // ₹/month
    slabs: [
      { upTo: 100, rate: 3.5 },   // 0–100 units: ₹3.50/unit
      { upTo: 300, rate: 5.0 },   // 101–300 units: ₹5.00/unit
      { upTo: Infinity, rate: 6.5 }, // 301+ units: ₹6.50/unit
    ],
    demandCharge: 0, // no demand charge for residential
    taxRate: 0.05,   // 5% electricity duty
  },
  COMMERCIAL: {
    fixedCharge: 350,
    slabs: [
      { upTo: 500, rate: 6.0 },
      { upTo: Infinity, rate: 7.5 },
    ],
    demandCharge: 150, // ₹/kVA of contracted demand per month
    taxRate: 0.05,
  },
  INDUSTRIAL: {
    fixedCharge: 750,
    slabs: [
      { upTo: 1000, rate: 5.5 },
      { upTo: Infinity, rate: 6.8 },
    ],
    demandCharge: 200, // ₹/kVA of contracted demand per month
    taxRate: 0.05,
  },
} as const;

export type ConsumerTypeTariff = keyof typeof TARIFF;

// Power factor penalty: applied when PF < 0.9
// Penalty = 1% of energy charge per 0.01 drop below 0.9
export const PF_THRESHOLD = 0.9;
export const PF_PENALTY_RATE = 0.01; // 1% per 0.01 PF drop

export function calculateSlabEnergy(units: number, type: ConsumerTypeTariff): number {
  const slabs = TARIFF[type].slabs;
  let remaining = units;
  let charge = 0;
  let prevUpTo = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabUnits = Math.min(remaining, slab.upTo - prevUpTo);
    charge += slabUnits * slab.rate;
    remaining -= slabUnits;
    prevUpTo = slab.upTo;
  }

  return parseFloat(charge.toFixed(2));
}
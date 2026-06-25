export const TOD_RATES = {
  day: 6.0,      // 6AM–6PM  ₹/unit
  peak: 9.0,     // 6PM–10PM ₹/unit
  offPeak: 5.0,  // 10PM–6AM ₹/unit
} as const;

export const TOD_FIXED_CHARGE = {
  RESIDENTIAL: 100,
  COMMERCIAL: 350,
  INDUSTRIAL: 750,
} as const;

export const TOD_TAX_RATE = 0.05;

export interface TodBillBreakdown {
  consumerId: string;
  consumerNumber: string;
  consumerType: string;
  billingMonth: number;
  billingYear: number;
  // Unit breakdown
  dayUnits: number;
  peakUnits: number;
  offPeakUnits: number;
  totalUnits: number;
  // Charge breakdown
  dayCharge: number;
  peakCharge: number;
  offPeakCharge: number;
  energyCharge: number;
  fixedCharge: number;
  taxAmount: number;
  totalAmount: number;
  // Source readings
  readingsUsed: number;
  hasCompleteTodData: boolean;
}

export function calculateTodBill(
  dayUnits: number,
  peakUnits: number,
  offPeakUnits: number,
  consumerType: keyof typeof TOD_FIXED_CHARGE
): {
  dayCharge: number;
  peakCharge: number;
  offPeakCharge: number;
  energyCharge: number;
  fixedCharge: number;
  taxAmount: number;
  totalAmount: number;
} {
  const dayCharge = parseFloat((dayUnits * TOD_RATES.day).toFixed(2));
  const peakCharge = parseFloat((peakUnits * TOD_RATES.peak).toFixed(2));
  const offPeakCharge = parseFloat((offPeakUnits * TOD_RATES.offPeak).toFixed(2));
  const energyCharge = parseFloat(
    (dayCharge + peakCharge + offPeakCharge).toFixed(2)
  );
  const fixedCharge = TOD_FIXED_CHARGE[consumerType];
  const subtotal = energyCharge + fixedCharge;
  const taxAmount = parseFloat((subtotal * TOD_TAX_RATE).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  return {
    dayCharge,
    peakCharge,
    offPeakCharge,
    energyCharge,
    fixedCharge,
    taxAmount,
    totalAmount,
  };
}
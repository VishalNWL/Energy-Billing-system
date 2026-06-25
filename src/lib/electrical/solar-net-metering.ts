import { calculateSlabEnergy, ConsumerTypeTariff } from "@/lib/billing/tariff";

export interface SolarNetMeteringResult {
  consumedUnits: number;
  generatedUnits: number;
  netUnits: number;
  surplusUnits: number;
  hasSurplus: boolean;
  grossBillAmount: number;
  netBillAmount: number;
  solarAdjustment: number;
  savingsPercent: number;
}

export function calculateNetMetering(
  consumedUnits: number,
  generatedUnits: number,
  consumerType: ConsumerTypeTariff,
  fixedCharge: number,
  taxRate: number
): SolarNetMeteringResult {
  const netUnits = Math.max(0, consumedUnits - generatedUnits);
  const surplusUnits = Math.max(0, generatedUnits - consumedUnits);
  const hasSurplus = surplusUnits > 0;

  // Gross bill (without solar)
  const grossEnergyCharge = calculateSlabEnergy(consumedUnits, consumerType);
  const grossSubtotal = grossEnergyCharge + fixedCharge;
  const grossBillAmount = parseFloat(
    (grossSubtotal * (1 + taxRate)).toFixed(2)
  );

  // Net bill (with solar deduction)
  const netEnergyCharge = calculateSlabEnergy(netUnits, consumerType);
  const netSubtotal = netEnergyCharge + fixedCharge;
  const netBillAmount = parseFloat(
    (netSubtotal * (1 + taxRate)).toFixed(2)
  );

  const solarAdjustment = parseFloat(
    (grossBillAmount - netBillAmount).toFixed(2)
  );

  const savingsPercent =
    grossBillAmount > 0
      ? parseFloat(
          ((solarAdjustment / grossBillAmount) * 100).toFixed(1)
        )
      : 0;

  return {
    consumedUnits,
    generatedUnits,
    netUnits,
    surplusUnits,
    hasSurplus,
    grossBillAmount,
    netBillAmount,
    solarAdjustment,
    savingsPercent,
  };
}

export function estimateSolarGeneration(
  installedCapacityKW: number,
  hoursPerDay: number = 5, // average peak sun hours in India
  daysInMonth: number = 30
): number {
  // Monthly generation estimate = Capacity × Peak Sun Hours × Days × 0.8 (efficiency)
  return parseFloat(
    (installedCapacityKW * hoursPerDay * daysInMonth * 0.8).toFixed(2)
  );
}

export function calculatePaybackPeriod(
  installedCapacityKW: number,
  installationCostPerKW: number = 60000, // ₹60,000/kW typical India cost
  monthlySavings: number
): { years: number; months: number } {
  const totalCost = installedCapacityKW * installationCostPerKW;
  const totalMonths =
    monthlySavings > 0 ? Math.ceil(totalCost / monthlySavings) : 0;
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}
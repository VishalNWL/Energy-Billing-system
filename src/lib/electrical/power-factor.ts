export const PF_THRESHOLD = 0.9;
export const PF_WARNING = 0.85;
export const PF_CRITICAL = 0.7;
export const PF_PENALTY_RATE = 0.01; // 1% per 0.01 drop

export type PFStatus = "EXCELLENT" | "ACCEPTABLE" | "WARNING" | "PENALTY" | "CRITICAL";

export interface PFCalculation {
  activePowerKW: number;
  reactivePowerKVAR: number;
  apparentPowerKVA: number;
  powerFactor: number;
  status: PFStatus;
  penaltyPercent: number;
}

export function calculatePowerFactor(
  activePowerKW: number,
  reactivePowerKVAR: number
): PFCalculation {
  // kVA = √(kW² + kVAR²)
  const apparentPowerKVA = parseFloat(
    Math.sqrt(
      Math.pow(activePowerKW, 2) + Math.pow(reactivePowerKVAR, 2)
    ).toFixed(3)
  );

  // PF = kW / kVA
  const powerFactor =
    apparentPowerKVA === 0
      ? 0
      : parseFloat((activePowerKW / apparentPowerKVA).toFixed(4));

  // Status
  let status: PFStatus;
  if (powerFactor >= PF_THRESHOLD) {
    status = powerFactor >= 0.95 ? "EXCELLENT" : "ACCEPTABLE";
  } else if (powerFactor >= PF_WARNING) {
    status = "WARNING";
  } else if (powerFactor >= PF_CRITICAL) {
    status = "PENALTY";
  } else {
    status = "CRITICAL";
  }

  // Penalty %
  const penaltyPercent =
    powerFactor < PF_THRESHOLD
      ? parseFloat(
          (
            Math.floor((PF_THRESHOLD - powerFactor) / 0.01) *
            PF_PENALTY_RATE *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    activePowerKW,
    reactivePowerKVAR,
    apparentPowerKVA,
    powerFactor,
    status,
    penaltyPercent,
  };
}

export function calculatePFPenaltyAmount(
  energyCharge: number,
  powerFactor: number
): number {
  if (powerFactor >= PF_THRESHOLD) return 0;
  const steps = Math.floor((PF_THRESHOLD - powerFactor) / 0.01);
  return parseFloat((energyCharge * PF_PENALTY_RATE * steps).toFixed(2));
}

export function getPFStatusConfig(status: PFStatus) {
  const config = {
    EXCELLENT: {
      label: "Excellent",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200",
      badge: "default" as const,
    },
    ACCEPTABLE: {
      label: "Acceptable",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200",
      badge: "secondary" as const,
    },
    WARNING: {
      label: "Warning",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200",
      badge: "secondary" as const,
    },
    PENALTY: {
      label: "Penalty",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/20",
      border: "border-orange-200",
      badge: "destructive" as const,
    },
    CRITICAL: {
      label: "Critical",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200",
      badge: "destructive" as const,
    },
  };
  return config[status];
}
export type FeederLossStatus =
  | "EXCELLENT"
  | "ACCEPTABLE"
  | "WARNING"
  | "CRITICAL";

export interface FeederLossResult {
  feederId: string;
  feederName: string;
  capacityKW: number;
  energySuppliedKWh: number;
  energyBilledKWh: number;
  distributionLossKWh: number;
  lossPercent: number;
  status: FeederLossStatus;
  transformerCount: number;
  consumerCount: number;
}

export function getLossStatus(lossPercent: number): FeederLossStatus {
  if (lossPercent < 5) return "EXCELLENT";
  if (lossPercent < 10) return "ACCEPTABLE";
  if (lossPercent < 15) return "WARNING";
  return "CRITICAL";
}

export function getLossStatusConfig(status: FeederLossStatus) {
  const config = {
    EXCELLENT: {
      label: "Excellent",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200",
      badge: "default" as const,
      barColor: "#16a34a",
    },
    ACCEPTABLE: {
      label: "Acceptable",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200",
      badge: "secondary" as const,
      barColor: "#2563eb",
    },
    WARNING: {
      label: "Warning",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200",
      badge: "secondary" as const,
      barColor: "#ca8a04",
    },
    CRITICAL: {
      label: "Critical — Investigate",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200",
      badge: "destructive" as const,
      barColor: "#dc2626",
    },
  };
  return config[status];
}

export function calculateFeederLoss(
  energySuppliedKWh: number,
  energyBilledKWh: number
): { lossKWh: number; lossPercent: number; status: FeederLossStatus } {
  const lossKWh = parseFloat(
    Math.max(0, energySuppliedKWh - energyBilledKWh).toFixed(2)
  );
  const lossPercent =
    energySuppliedKWh > 0
      ? parseFloat(((lossKWh / energySuppliedKWh) * 100).toFixed(1))
      : 0;
  const status = getLossStatus(lossPercent);
  return { lossKWh, lossPercent, status };
}
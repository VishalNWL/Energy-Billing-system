export type LoadingStatus =
  | "UNDER_UTILIZED"
  | "NORMAL"
  | "HIGH_LOAD"
  | "OVERLOADED";

export interface TransformerLoadingResult {
  transformerId: string;
  transformerName: string;
  capacityKVA: number;
  location: string;
  feederName: string;
  feederId: string;
  totalConnectedLoadKW: number;
  totalConnectedLoadKVA: number;
  loadingPercent: number;
  status: LoadingStatus;
  consumerCount: number;
  availableCapacityKVA: number;
  canAddLoadKW: number;
}

export function getLoadingStatus(loadingPercent: number): LoadingStatus {
  if (loadingPercent < 50) return "UNDER_UTILIZED";
  if (loadingPercent < 80) return "NORMAL";
  if (loadingPercent <= 100) return "HIGH_LOAD";
  return "OVERLOADED";
}

export function getLoadingStatusConfig(status: LoadingStatus) {
  const config = {
    UNDER_UTILIZED: {
      label: "Under Utilized",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200",
      badge: "default" as const,
      barColor: "#16a34a",
    },
    NORMAL: {
      label: "Normal",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200",
      badge: "secondary" as const,
      barColor: "#2563eb",
    },
    HIGH_LOAD: {
      label: "High Load",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200",
      badge: "secondary" as const,
      barColor: "#ca8a04",
    },
    OVERLOADED: {
      label: "Overloaded",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200",
      badge: "destructive" as const,
      barColor: "#dc2626",
    },
  };
  return config[status];
}

export function calculateTransformerLoading(transformer: {
  id: string;
  transformerName: string;
  capacityKVA: number;
  location: string;
  feeder: { id: string; feederName: string };
  consumers: { sanctionedLoad: number }[];
}): TransformerLoadingResult {
  const totalConnectedLoadKW = parseFloat(
    transformer.consumers
      .reduce((sum, c) => sum + c.sanctionedLoad, 0)
      .toFixed(2)
  );

  // Convert kW → kVA assuming PF = 0.9
  const totalConnectedLoadKVA = parseFloat(
    (totalConnectedLoadKW / 0.9).toFixed(2)
  );

  const loadingPercent = parseFloat(
    ((totalConnectedLoadKVA / transformer.capacityKVA) * 100).toFixed(1)
  );

  const status = getLoadingStatus(loadingPercent);

  const availableCapacityKVA = parseFloat(
    Math.max(0, transformer.capacityKVA - totalConnectedLoadKVA).toFixed(2)
  );

  // How many more kW can be added (at PF 0.9)
  const canAddLoadKW = parseFloat(
    (availableCapacityKVA * 0.9).toFixed(2)
  );

  return {
    transformerId: transformer.id,
    transformerName: transformer.transformerName,
    capacityKVA: transformer.capacityKVA,
    location: transformer.location,
    feederName: transformer.feeder.feederName,
    feederId: transformer.feeder.id,
    totalConnectedLoadKW,
    totalConnectedLoadKVA,
    loadingPercent,
    status,
    consumerCount: transformer.consumers.length,
    availableCapacityKVA,
    canAddLoadKW,
  };
}
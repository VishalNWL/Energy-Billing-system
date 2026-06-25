"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { LoadingStatus } from "@/lib/electrical/transformer-loading";
import { getLoadingStatusConfig } from "@/lib/electrical/transformer-loading";

interface LoadingGaugeProps {
  loadingPercent: number;
  status: LoadingStatus;
  capacityKVA: number;
}

export function LoadingGauge({
  loadingPercent,
  status,
  capacityKVA,
}: LoadingGaugeProps) {
  const config = getLoadingStatusConfig(status);
  const data = [{ value: Math.min(loadingPercent, 100), fill: config.barColor }];

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <RadialBar dataKey="value" cornerRadius={8} background />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          className="text-2xl font-bold"
          style={{ color: config.barColor }}
        >
          {loadingPercent}%
        </p>
        <p className="text-xs text-muted-foreground">{capacityKVA} kVA</p>
      </div>
    </div>
  );
}
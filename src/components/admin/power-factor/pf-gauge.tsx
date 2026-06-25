"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { PFStatus } from "@/lib/electrical/power-factor";

interface PFGaugeProps {
  powerFactor: number;
  status: PFStatus;
}

const STATUS_COLOR: Record<PFStatus, string> = {
  EXCELLENT: "#16a34a",
  ACCEPTABLE: "#2563eb",
  WARNING: "#ca8a04",
  PENALTY: "#ea580c",
  CRITICAL: "#dc2626",
};

export function PFGauge({ powerFactor, status }: PFGaugeProps) {
  // Semicircle gauge: value 0–1 mapped to 0–180 degrees
  const filled = powerFactor;
  const empty = 1 - filled;
  const color = STATUS_COLOR[status];

  const data = [
    { value: filled },
    { value: empty },
  ];

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={200} height={110}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 text-center">
        <p className="text-3xl font-bold" style={{ color }}>
          {powerFactor.toFixed(3)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Power Factor</p>
      </div>
    </div>
  );
}
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyLoadPoint } from "@/lib/queries/load-analysis";

interface Props {
  data: DailyLoadPoint[];
  sanctionedLoad: number;
  peakDate?: string | null;
}

export function DailyLoadChart({ data, sanctionedLoad, peakDate }: Props) {
  const hasTod = data.some(
    (d) => d.peakUnits !== null || d.dayUnits !== null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Daily Load Curve{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (last 30 readings)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Not enough readings for daily analysis.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={11}
                tick={{ fill: "#64748b" }}
                interval="preserveStartEnd"
              />
              <YAxis
                fontSize={11}
                tick={{ fill: "#64748b" }}
                label={{
                  value: "kWh",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                }}
              />
              <Tooltip
               formatter={(value, name) => {
        const num = Number(value);
        return isNaN(num) ? ["—", String(name)] : [`${num} kWh`, String(name)];
        }}
                    />
              <Legend />
              {/* Sanctioned load reference line */}
              <ReferenceLine
                y={sanctionedLoad}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: `Sanctioned: ${sanctionedLoad} kW`,
                  fill: "#f59e0b",
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="units"
                stroke="#2563eb"
                fill="url(#colorUnits)"
                name="Total Units"
                strokeWidth={2}
              />
              {hasTod && (
                <>
                  <Area
                    type="monotone"
                    dataKey="peakUnits"
                    stroke="#dc2626"
                    fill="url(#colorPeak)"
                    name="Peak (6PM–10PM)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="dayUnits"
                    stroke="#16a34a"
                    fill="none"
                    name="Day (6AM–6PM)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="offPeakUnits"
                    stroke="#7c3aed"
                    fill="none"
                    name="Off-Peak (10PM–6AM)"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
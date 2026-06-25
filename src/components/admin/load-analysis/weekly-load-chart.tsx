"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyLoadPoint } from "@/lib/queries/load-analysis";

export function WeeklyLoadChart({ data }: { data: WeeklyLoadPoint[] }) {
  const maxUnits = Math.max(...data.map((d) => d.units), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Weekly Load Curve{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (last 12 weeks)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Not enough data for weekly analysis.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={11} tick={{ fill: "#64748b" }} />
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
             formatter={(value) => {
  const num = Number(value);
  return isNaN(num) ? ["—", "Units"] : [`${num} kWh`, "Units"];
}}
              />
              <Bar dataKey="units" name="Units (kWh)" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.units === maxUnits ? "#dc2626" : "#2563eb"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
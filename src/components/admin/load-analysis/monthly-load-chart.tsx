"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyLoadPoint } from "@/lib/queries/load-analysis";

export function MonthlyLoadChart({ data }: { data: MonthlyLoadPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Monthly Consumption & Revenue{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (last 12 months)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No bills available for monthly analysis.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} tick={{ fill: "#64748b" }} />
              <YAxis
                yAxisId="left"
                fontSize={11}
                tick={{ fill: "#64748b" }}
                label={{
                  value: "kWh",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={11}
                tick={{ fill: "#64748b" }}
                label={{
                  value: "₹",
                  angle: 90,
                  position: "insideRight",
                  fontSize: 11,
                }}
              />
              <Tooltip
             formatter={(value, name) => {
                const num = Number(value);
                if (isNaN(num)) return ["—", String(name)];
                return String(name) === "Revenue (₹)"
                    ? [`₹${num.toLocaleString("en-IN")}`, String(name)]
                    : [`${num} kWh`, String(name)];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="units"
                name="Units (kWh)"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹)"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
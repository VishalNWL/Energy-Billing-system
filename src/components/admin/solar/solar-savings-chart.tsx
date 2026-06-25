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

interface MonthlyPoint {
  month: string;
  consumedUnits: number;
  generatedUnits: number;
  netUnits: number;
  grossBill: number;
  netBill: number;
  savings: number;
}

export function SolarSavingsChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Monthly Consumption vs Solar Generation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No billing data available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                fontSize={11}
                tick={{ fill: "#64748b" }}
              />
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
                  const n = String(name);
                  return n.includes("₹") || n.includes("Bill") || n.includes("Savings")
                    ? [`₹${num.toLocaleString("en-IN")}`, n]
                    : [`${num} kWh`, n];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="consumedUnits"
                name="Consumed (kWh)"
                fill="#2563eb"
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="generatedUnits"
                name="Generated (kWh)"
                fill="#f59e0b"
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="netUnits"
                name="Net (kWh)"
                fill="#16a34a"
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="savings"
                name="Monthly Savings (₹)"
                stroke="#dc2626"
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
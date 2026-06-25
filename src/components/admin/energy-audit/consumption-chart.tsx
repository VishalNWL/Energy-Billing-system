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
  units: number;
  amount: number;
}

export function AuditConsumptionChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          12-Month Consumption History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No billing history available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
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
                  return String(name).includes("₹")
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
                opacity={0.8}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="amount"
                name="Bill Amount (₹)"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
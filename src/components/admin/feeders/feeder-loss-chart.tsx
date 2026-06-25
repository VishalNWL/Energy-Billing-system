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
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LossTrendPoint {
  date: string;
  supplied: number;
  billed: number;
  loss: number;
  lossPercent: number;
}

export function FeederLossChart({ data }: { data: LossTrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Energy Supplied vs Billed — Loss Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No feeder energy readings yet. Add a reading to see the loss
            trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
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
                domain={[0, 30]}
                fontSize={11}
                tick={{ fill: "#64748b" }}
                tickFormatter={(v) => `${v}%`}
                label={{
                  value: "Loss %",
                  angle: 90,
                  position: "insideRight",
                  fontSize: 11,
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  const num = Number(value);
                  if (isNaN(num)) return ["—", String(name)];
                  return String(name) === "Loss %"
                    ? [`${num.toFixed(1)}%`, String(name)]
                    : [`${num.toFixed(1)} kWh`, String(name)];
                }}
              />
              <Legend />
              <ReferenceLine
                yAxisId="right"
                y={10}
                stroke="#ca8a04"
                strokeDasharray="5 5"
                label={{
                  value: "10% Warning",
                  fill: "#ca8a04",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                yAxisId="right"
                y={15}
                stroke="#dc2626"
                strokeDasharray="5 5"
                label={{
                  value: "15% Critical",
                  fill: "#dc2626",
                  fontSize: 10,
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="supplied"
                name="Supplied (kWh)"
                fill="#2563eb"
                opacity={0.8}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="billed"
                name="Billed (kWh)"
                fill="#16a34a"
                opacity={0.8}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="lossPercent"
                name="Loss %"
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
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PFTrendPoint {
  date: string;
  pf: number;
  kw: number;
  kvar: number;
}

export function PFTrendChart({ data }: { data: PFTrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Power Factor Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No readings yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={11}
                tick={{ fill: "#64748b" }}
              />
              <YAxis
                domain={[0, 1]}
                fontSize={11}
                tick={{ fill: "#64748b" }}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                formatter={(value) => {
                  const num = Number(value);
                  return isNaN(num) ? ["—", ""] : [num.toFixed(3), "PF"];
                }}
              />
              <Legend />
              {/* PF threshold reference line */}
              <ReferenceLine
                y={0.9}
                stroke="#ca8a04"
                strokeDasharray="5 5"
                label={{
                  value: "Min PF (0.9)",
                  fill: "#ca8a04",
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={0.85}
                stroke="#dc2626"
                strokeDasharray="5 5"
                label={{
                  value: "Penalty (0.85)",
                  fill: "#dc2626",
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="pf"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Power Factor"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
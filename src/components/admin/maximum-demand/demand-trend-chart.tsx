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
  ReferenceLine,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DemandReadingPoint } from "@/lib/electrical/maximum-demand";

interface Props {
  data: DemandReadingPoint[];
  contractedDemandKW: number | null;
  avgDemandKW: number;
}

export function DemandTrendChart({
  data,
  contractedDemandKW,
  avgDemandKW,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Demand Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No demand readings yet.
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
                fontSize={11}
                tick={{ fill: "#64748b" }}
                label={{
                  value: "kW",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                }}
              />
              <Tooltip
                formatter={(value) => {
                  const num = Number(value);
                  return isNaN(num) ? ["—", ""] : [`${num} kW`, "Demand"];
                }}
              />
              <Legend />

              {/* Contracted demand reference line */}
              {contractedDemandKW && (
                <ReferenceLine
                  y={contractedDemandKW}
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  label={{
                    value: `Contracted: ${contractedDemandKW} kW`,
                    fill: "#dc2626",
                    fontSize: 11,
                  }}
                />
              )}

              {/* Average demand reference line */}
              <ReferenceLine
                y={avgDemandKW}
                stroke="#2563eb"
                strokeDasharray="3 3"
                label={{
                  value: `Avg: ${avgDemandKW} kW`,
                  fill: "#2563eb",
                  fontSize: 11,
                }}
              />

              <Bar
                dataKey="demandKW"
                name="Demand (kW)"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.exceedsContract
                        ? "#dc2626"
                        : entry.isMax
                        ? "#f59e0b"
                        : "#2563eb"
                    }
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
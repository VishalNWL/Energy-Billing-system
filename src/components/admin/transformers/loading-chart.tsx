"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransformerLoadingResult } from "@/lib/electrical/transformer-loading";
import { getLoadingStatusConfig } from "@/lib/electrical/transformer-loading";

export function TransformerLoadingChart({
  data,
}: {
  data: TransformerLoadingResult[];
}) {
  const chartData = data.map((t) => ({
    name: t.transformerName,
    loading: t.loadingPercent,
    capacity: t.capacityKVA,
    status: t.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Transformer Loading Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No transformers configured yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 120]}
                fontSize={11}
                tick={{ fill: "#64748b" }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                tick={{ fill: "#64748b" }}
                width={120}
              />
              <Tooltip
                formatter={(value) => {
                  const num = Number(value);
                  return isNaN(num) ? ["—", ""] : [`${num}%`, "Loading"];
                }}
              />
              <ReferenceLine
                x={80}
                stroke="#ca8a04"
                strokeDasharray="5 5"
                label={{ value: "80%", fill: "#ca8a04", fontSize: 11 }}
              />
              <ReferenceLine
                x={100}
                stroke="#dc2626"
                strokeDasharray="5 5"
                label={{ value: "100%", fill: "#dc2626", fontSize: 11 }}
              />
              <Bar dataKey="loading" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getLoadingStatusConfig(entry.status).barColor}
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
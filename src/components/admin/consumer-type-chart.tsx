"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BreakdownPoint {
  consumerType: string;
  _count: { _all: number };
}

const COLORS: Record<string, string> = {
  RESIDENTIAL: "#2563eb",
  COMMERCIAL: "#f59e0b",
  INDUSTRIAL: "#dc2626",
};

export function ConsumerTypeChart({ data }: { data: BreakdownPoint[] }) {
  const chartData = data.map((d) => ({
    name: d.consumerType,
    value: d._count._all,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumer Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
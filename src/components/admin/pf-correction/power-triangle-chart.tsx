"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PFCorrectionResult } from "@/lib/electrical/pf-correction";

export function PowerTriangleChart({
  result,
}: {
  result: PFCorrectionResult;
}) {
  // Build power triangle visualization data
  const beforeData = [
    { x: 0, y: 0, label: "Origin" },
    { x: result.activePowerKW, y: 0, label: "P (kW)" },
    { x: result.activePowerKW, y: result.currentKVAR, label: "Before" },
    { x: 0, y: 0 },
  ];

  const afterData = [
    { x: result.activePowerKW, y: 0 },
    { x: result.activePowerKW, y: result.targetKVAR, label: "After" },
    { x: 0, y: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Power Triangle — Before & After Correction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, result.activePowerKW * 1.2]}
              label={{
                value: "Active Power (kW)",
                position: "insideBottom",
                offset: -5,
                fontSize: 11,
              }}
              fontSize={11}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, result.currentKVAR * 1.2]}
              label={{
                value: "Reactive Power (kVAR)",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
              }}
              fontSize={11}
            />
            <Tooltip
              formatter={(value) => {
                const num = Number(value);
                return isNaN(num) ? ["—", ""] : [`${num.toFixed(2)}`, ""];
              }}
            />
            <Legend />
            <Line
              data={beforeData}
              dataKey="y"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4 }}
              name={`Before (PF=${result.currentPF})`}
            />
            <Line
              data={afterData}
              dataKey="y"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 4 }}
              name={`After (PF=${result.targetPF})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
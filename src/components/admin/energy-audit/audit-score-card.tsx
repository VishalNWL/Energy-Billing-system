"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditScore } from "@/lib/electrical/energy-audit";

const GRADE_CONFIG = {
  A: { color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-200" },
  B: { color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200" },
  C: { color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200" },
  D: { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200" },
  F: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200" },
};

interface Props {
  score: AuditScore;
}

export function AuditScoreCard({ score }: Props) {
  const config = GRADE_CONFIG[score.grade];

  const breakdown = [
    { label: "Load Factor", score: score.loadFactorScore, max: 20 },
    { label: "Power Factor", score: score.powerFactorScore, max: 20 },
    { label: "Solar Adoption", score: score.solarScore, max: 20 },
    { label: "Demand Management", score: score.demandScore, max: 20 },
    { label: "Distribution Loss", score: 20 - Math.min(20, score.total - score.loadFactorScore - score.powerFactorScore - score.solarScore - score.demandScore), max: 20 },
  ];

  return (
    <Card className={`border ${config.border} ${config.bg}`}>
      <CardHeader>
        <CardTitle className="text-base">Energy Audit Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p
              className={`text-6xl font-black ${config.color}`}
            >
              {score.grade}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Grade</p>
          </div>
          <div className="flex-1">
            <p className={`text-4xl font-bold ${config.color}`}>
              {score.total}
              <span className="text-lg font-normal text-muted-foreground">
                /100
              </span>
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${score.total}%`,
                  backgroundColor:
                    score.grade === "A"
                      ? "#16a34a"
                      : score.grade === "B"
                      ? "#2563eb"
                      : score.grade === "C"
                      ? "#ca8a04"
                      : score.grade === "D"
                      ? "#ea580c"
                      : "#dc2626",
                }}
              />
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-2">
          {breakdown.map(({ label, score: s, max }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="w-36 text-muted-foreground text-xs">
                {label}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-current"
                  style={{
                    width: `${(s / max) * 100}%`,
                    color: s === max ? "#16a34a" : "#2563eb",
                    backgroundColor:
                      s === max ? "#16a34a" : s >= max * 0.6 ? "#2563eb" : "#dc2626",
                  }}
                />
              </div>
              <span className="w-12 text-right font-medium text-xs">
                {s}/{max}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
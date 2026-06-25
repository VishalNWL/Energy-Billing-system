"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PowerTriangleChart } from "./power-triangle-chart";
import type { PFCorrectionResult } from "@/lib/electrical/pf-correction";
import { CheckCircle, Zap } from "lucide-react";

export function CorrectionResult({ result }: { result: PFCorrectionResult }) {
  return (
    <div className="space-y-6">
      {/* Main result */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-base text-green-800 dark:text-green-300">
              Capacitor Bank Recommendation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Required Capacitor Bank Size
            </p>
            <p className="text-5xl font-bold text-green-700 dark:text-green-400 mt-1">
              {result.requiredKVAR}
              <span className="text-2xl ml-1">kVAR</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Round up to nearest standard size:{" "}
              <span className="font-bold text-green-700 dark:text-green-400">
                {result.capacitorBankKVAR} kVAR
              </span>
            </p>
          </div>

          {/* Standard sizes */}
          {result.standardSizes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Available standard sizes:
              </p>
              <div className="flex gap-2 flex-wrap">
                {result.standardSizes.map((size) => (
                  <Badge
                    key={size}
                    variant={
                      size === result.capacitorBankKVAR
                        ? "default"
                        : "secondary"
                    }
                  >
                    {size} kVAR
                    {size === result.capacitorBankKVAR && " ✓"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculation breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Before Correction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "Power Factor", value: result.currentPF.toFixed(3) },
              { label: "Angle (φ₁)", value: `${result.currentAngleDeg}°` },
              { label: "Active Power", value: `${result.activePowerKW} kW` },
              { label: "Reactive Power", value: `${result.currentKVAR} kVAR` },
              { label: "Apparent Power", value: `${result.currentKVA} kVA` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">After Correction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "Power Factor", value: result.targetPF.toFixed(3) },
              { label: "Angle (φ₂)", value: `${result.targetAngleDeg}°` },
              { label: "Active Power", value: `${result.activePowerKW} kW` },
              { label: "Reactive Power", value: `${result.targetKVAR} kVAR` },
              { label: "Apparent Power", value: `${result.targetKVA} kVA` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-green-600">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Formula breakdown */}
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" /> Calculation Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-sm space-y-1">
          <p>Qc = P × (tanφ₁ − tanφ₂)</p>
          <p>
            Qc = {result.activePowerKW} ×
            (tan{result.currentAngleDeg}° − tan{result.targetAngleDeg}°)
          </p>
          <p>
            Qc = {result.activePowerKW} ×
            ({Math.tan((result.currentAngleDeg * Math.PI) / 180).toFixed(4)} −
            {Math.tan((result.targetAngleDeg * Math.PI) / 180).toFixed(4)})
          </p>
          <p className="font-bold text-green-700 dark:text-green-400">
            Qc = {result.requiredKVAR} kVAR
          </p>
        </CardContent>
      </Card>

      {/* kVA savings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benefits of Correction</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            {
              label: "kVA Reduced",
              value: `${result.kvaReduction} kVA`,
              color: "text-green-600",
            },
            {
              label: "% kVA Reduction",
              value: `${result.percentKVAReduction}%`,
              color: "text-green-600",
            },
            {
              label: "PF Improvement",
              value: `${result.currentPF} → ${result.targetPF}`,
              color: "text-blue-600",
            },
            {
              label: "Capacitance",
              value: result.capacitanceUF
                ? `${result.capacitanceUF} μF`
                : "Provide voltage",
              color: "text-muted-foreground",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Power triangle chart */}
      <PowerTriangleChart result={result} />

      {/* Capacitance note */}
      {result.capacitanceUF && (
        <Card className="bg-muted/40">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            <p>
              <strong>Physical Capacitor:</strong> At{" "}
              {result.capacitanceUF} μF capacitance is required (3-phase
              delta connection). For star connection, multiply by 3.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
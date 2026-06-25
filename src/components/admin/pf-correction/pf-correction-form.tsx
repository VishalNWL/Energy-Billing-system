"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pfCorrectionSchema, PFCorrectionFormData } from "@/lib/validations/pf-correction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { calculatePFCorrection } from "@/lib/electrical/pf-correction";
import { CorrectionResult } from "./correction-result";
import type { PFCorrectionResult } from "@/lib/electrical/pf-correction";

interface Props {
  defaultKW?: number;
  defaultCurrentPF?: number;
}

export function PFCorrectionForm({ defaultKW, defaultCurrentPF }: Props) {
  const [result, setResult] = useState<PFCorrectionResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PFCorrectionFormData>({
    resolver: zodResolver(pfCorrectionSchema),
    defaultValues: {
      activePowerKW: defaultKW ?? undefined,
      currentPF: defaultCurrentPF ?? undefined,
      targetPF: 0.95,
      supplyVoltageV: 415, // standard 3-phase LT voltage in India
    },
  });

  function handleCalculate(data: PFCorrectionFormData) {
    const res = calculatePFCorrection(data);
    setResult(res);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Input Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(handleCalculate)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-1">
              <Label htmlFor="activePowerKW">Active Power (kW)</Label>
              <Input
                id="activePowerKW"
                type="number"
                step="0.1"
                {...register("activePowerKW", { valueAsNumber: true })}
                placeholder="e.g. 100"
              />
              <p className="text-xs text-muted-foreground">
                From energy meter or wattmeter reading
              </p>
              {errors.activePowerKW && (
                <p className="text-xs text-red-500">
                  {errors.activePowerKW.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="currentPF">Current Power Factor</Label>
              <Input
                id="currentPF"
                type="number"
                step="0.001"
                {...register("currentPF", { valueAsNumber: true })}
                placeholder="e.g. 0.75"
              />
              <p className="text-xs text-muted-foreground">
                From PF meter or Step 10 readings
              </p>
              {errors.currentPF && (
                <p className="text-xs text-red-500">
                  {errors.currentPF.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="targetPF">Target Power Factor</Label>
              <Input
                id="targetPF"
                type="number"
                step="0.001"
                {...register("targetPF", { valueAsNumber: true })}
                placeholder="e.g. 0.95"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 0.95 (above penalty threshold of 0.9)
              </p>
              {errors.targetPF && (
                <p className="text-xs text-red-500">
                  {errors.targetPF.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplyVoltageV">
                Supply Voltage (V){" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="supplyVoltageV"
                type="number"
                step="1"
                {...register("supplyVoltageV", { valueAsNumber: true })}
                placeholder="e.g. 415"
              />
              <p className="text-xs text-muted-foreground">
                For capacitance (μF) calculation. 415V = standard 3-phase LT
              </p>
              {errors.supplyVoltageV && (
                <p className="text-xs text-red-500">
                  {errors.supplyVoltageV.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto">
                Calculate Capacitor Bank Size
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && <CorrectionResult result={result} />}
    </div>
  );
}
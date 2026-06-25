"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { powerFactorSchema, PowerFactorFormData } from "@/lib/validations/power-factor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addPowerFactorReading } from "@/lib/actions/power-factor";
import {
  calculatePowerFactor,
  getPFStatusConfig,
} from "@/lib/electrical/power-factor";
import { PFGauge } from "./pf-gauge";

export function PFReadingForm({ consumerId }: { consumerId: string }) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
const [liveCalc, setLiveCalc] = useState<ReturnType<
  typeof calculatePowerFactor
> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PowerFactorFormData>({
    resolver: zodResolver(powerFactorSchema),
    defaultValues: {
      readingDate: new Date().toISOString().slice(0, 10),
    },
  });

  const kw = watch("activePowerKW");
  const kvar = watch("reactivePowerKVAR");

  // Live calculation as user types
  function handleInputChange() {
    const kwVal = parseFloat(String(kw));
    const kvarVal = parseFloat(String(kvar));
    if (!isNaN(kwVal) && !isNaN(kvarVal) && kwVal > 0) {
      setLiveCalc(calculatePowerFactor(kwVal, kvarVal));
    } else {
      setLiveCalc(null);
    }
  }

  async function handleFormSubmit(data: PowerFactorFormData) {
    setServerErrors({});
    const result = await addPowerFactorReading(consumerId, data);
    if (!result.success && result.errors) {
      setServerErrors(result.errors as Record<string, string[]>);
      return;
    }
    router.push(`/admin/power-factor/${consumerId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      onChange={handleInputChange}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Power Measurement Input</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="activePowerKW">Active Power (kW)</Label>
            <Input
              id="activePowerKW"
              type="number"
              step="0.01"
              {...register("activePowerKW", { valueAsNumber: true })}
              placeholder="e.g. 45.5"
            />
            {errors.activePowerKW && (
              <p className="text-xs text-red-500">
                {errors.activePowerKW.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="reactivePowerKVAR">Reactive Power (kVAR)</Label>
            <Input
              id="reactivePowerKVAR"
              type="number"
              step="0.01"
              {...register("reactivePowerKVAR", { valueAsNumber: true })}
              placeholder="e.g. 22.0"
            />
            {errors.reactivePowerKVAR && (
              <p className="text-xs text-red-500">
                {errors.reactivePowerKVAR.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="readingDate">Reading Date</Label>
            <Input
              id="readingDate"
              type="date"
              {...register("readingDate")}
            />
            {errors.readingDate && (
              <p className="text-xs text-red-500">
                {errors.readingDate.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live PF calculation preview */}
      {liveCalc && (
        <Card
          className={`border ${getPFStatusConfig(liveCalc.status).border} ${getPFStatusConfig(liveCalc.status).bg}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Live Calculation</CardTitle>
              <Badge
                variant={getPFStatusConfig(liveCalc.status).badge}
              >
                {getPFStatusConfig(liveCalc.status).label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <PFGauge
                powerFactor={liveCalc.powerFactor}
                status={liveCalc.status}
              />
              <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                {[
                  { label: "Active Power (kW)", value: liveCalc.activePowerKW },
                  {
                    label: "Reactive Power (kVAR)",
                    value: liveCalc.reactivePowerKVAR,
                  },
                  {
                    label: "Apparent Power (kVA)",
                    value: liveCalc.apparentPowerKVA,
                  },
                  { label: "Power Factor", value: liveCalc.powerFactor.toFixed(4) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-bold text-lg">{value}</p>
                  </div>
                ))}
                {liveCalc.penaltyPercent > 0 && (
                  <div className="col-span-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-3">
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                      ⚠ PF Penalty: {liveCalc.penaltyPercent}% of energy
                      charge will be added to the bill.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save PF Reading"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/power-factor/${consumerId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  solarGenerationUpdateSchema,
  SolarGenerationUpdateFormData,
} from "@/lib/validations/solar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSolarGeneration } from "@/lib/actions/solar";

interface Props {
  consumerId: string;
  currentGeneratedUnits: number;
  installedCapacityKW: number;
}

export function UpdateGenerationForm({
  consumerId,
  currentGeneratedUnits,
  installedCapacityKW,
}: Props) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<
    Record<string, string[]>
  >({});
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SolarGenerationUpdateFormData>({
    resolver: zodResolver(solarGenerationUpdateSchema),
    defaultValues: { generatedUnits: currentGeneratedUnits },
  });

  function handleFormSubmit(data: SolarGenerationUpdateFormData) {
    setServerErrors({});
    startTransition(async () => {
      const result = await updateSolarGeneration(consumerId, data);
      if (!result.success && result.errors) {
        setServerErrors(result.errors as Record<string, string[]>);
        return;
      }
      router.push(`/admin/solar/${consumerId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Solar Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm border rounded-md px-4 py-3 bg-muted/40">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Installed Capacity</span>
              <span className="font-medium">{installedCapacityKW} kW</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">
                Current Recorded Generation
              </span>
              <span className="font-medium">
                {currentGeneratedUnits} kWh
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="generatedUnits">
              Total Generated Units (kWh)
            </Label>
            <Input
              id="generatedUnits"
              type="number"
              step="0.1"
              {...register("generatedUnits", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Cumulative kWh reading from solar inverter/meter
            </p>
            {errors.generatedUnits && (
              <p className="text-xs text-red-500">
                {errors.generatedUnits.message}
              </p>
            )}
            {serverErrors.generatedUnits && (
              <p className="text-xs text-red-500">
                {serverErrors.generatedUnits[0]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Update Generation"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/solar/${consumerId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
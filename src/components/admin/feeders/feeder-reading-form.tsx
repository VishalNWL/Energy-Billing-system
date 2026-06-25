"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  feederEnergyReadingSchema,
  FeederEnergyReadingFormData,
} from "@/lib/validations/feeder-reading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addFeederEnergyReading } from "@/lib/actions/feeder";

interface Props {
  feederId: string;
  feederName: string;
  currentBilledKWh: number;
}

export function FeederReadingForm({
  feederId,
  feederName,
  currentBilledKWh,
}: Props) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<
    Record<string, string[]>
  >({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeederEnergyReadingFormData>({
    resolver: zodResolver(feederEnergyReadingSchema),
    defaultValues: {
      readingDate: new Date().toISOString().slice(0, 10),
      energyBilledKWh: currentBilledKWh,
    },
  });

  const supplied = watch("energySuppliedKWh");
  const billed = watch("energyBilledKWh") ?? currentBilledKWh;
  const lossKWh = supplied > 0 ? Math.max(0, supplied - billed) : null;
  const lossPercent =
    lossKWh !== null && supplied > 0
      ? ((lossKWh / supplied) * 100).toFixed(1)
      : null;

  async function handleFormSubmit(data: FeederEnergyReadingFormData) {
    setServerErrors({});
    const result = await addFeederEnergyReading(feederId, data);
    if (!result.success && result.errors) {
      setServerErrors(result.errors as Record<string, string[]>);
      return;
    }
    router.push(`/admin/feeders/${feederId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Feeder</span>
            <span className="font-medium">{feederName}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">
              Total Billed (computed)
            </span>
            <span className="font-bold">
              {currentBilledKWh.toFixed(2)} kWh
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feeder Energy Reading</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="energySuppliedKWh">
              Energy Supplied (kWh)
            </Label>
            <Input
              id="energySuppliedKWh"
              type="number"
              step="0.1"
              {...register("energySuppliedKWh", { valueAsNumber: true })}
              placeholder="From feeder meter"
            />
            <p className="text-xs text-muted-foreground">
              Read from feeder energy meter at substation
            </p>
            {errors.energySuppliedKWh && (
              <p className="text-xs text-red-500">
                {errors.energySuppliedKWh.message}
              </p>
            )}
            {serverErrors.energySuppliedKWh && (
              <p className="text-xs text-red-500">
                {serverErrors.energySuppliedKWh[0]}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="energyBilledKWh">
              Energy Billed Override (kWh){" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="energyBilledKWh"
              type="number"
              step="0.1"
              {...register("energyBilledKWh", { valueAsNumber: true })}
              placeholder={String(currentBilledKWh)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use computed value from bills
            </p>
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
            {serverErrors.readingDate && (
              <p className="text-xs text-red-500">
                {serverErrors.readingDate[0]}
              </p>
            )}
          </div>

          {/* Live loss preview */}
          {lossKWh !== null && (
            <div
              className={`md:col-span-3 rounded-md border p-3 ${
                Number(lossPercent) >= 15
                  ? "border-red-200 bg-red-50 dark:bg-red-950/20"
                  : Number(lossPercent) >= 10
                  ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
                  : "border-green-200 bg-green-50 dark:bg-green-950/20"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Distribution Loss</span>
                <span className="font-bold text-lg">
                  {lossKWh.toFixed(2)} kWh ({lossPercent}%)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Reading"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/feeders/${feederId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
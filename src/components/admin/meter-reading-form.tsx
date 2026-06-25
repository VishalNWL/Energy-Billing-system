"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { meterReadingSchema, MeterReadingFormData } from "@/lib/validations/meter-reading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addMeterReading } from "@/lib/actions/meter-reading";

interface MeterReadingFormProps {
  consumerId: string;
  previousReading?: number | null;
  previousDate?: string | null;
  meterNumber: string;
}

export function MeterReadingForm({
  consumerId,
  previousReading,
  previousDate,
  meterNumber,
}: MeterReadingFormProps) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MeterReadingFormData>({
    resolver: zodResolver(meterReadingSchema),
    defaultValues: {
      readingDate: new Date().toISOString().slice(0, 10),
    },
  });

  const currentReading = watch("reading");
  const estimatedUnits =
    currentReading && previousReading != null
      ? Math.max(0, currentReading - previousReading)
      : null;

  async function handleFormSubmit(data: MeterReadingFormData) {
    setServerErrors({});
    const result = await addMeterReading(consumerId, data);

    if (!result.success && result.errors) {
      setServerErrors(result.errors as Record<string, string[]>);
      return;
    }

    router.push(`/admin/meter-readings/${consumerId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* Previous reading reference */}
      {previousReading != null && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Meter: </span>
                <span className="font-mono font-medium">{meterNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Previous Reading: </span>
                <span className="font-bold">{previousReading} kWh</span>
              </div>
              {previousDate && (
                <div>
                  <span className="text-muted-foreground">On: </span>
                  <span>{new Date(previousDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Meter Reading</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="reading">Current Reading (kWh)</Label>
            <Input
              id="reading"
              type="number"
              step="0.01"
              {...register("reading", { valueAsNumber: true })}
              placeholder="e.g. 4523.50"
            />
            {errors.reading && (
              <p className="text-xs text-red-500">{errors.reading.message}</p>
            )}
            {serverErrors.reading && (
              <p className="text-xs text-red-500">{serverErrors.reading[0]}</p>
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
              <p className="text-xs text-red-500">{errors.readingDate.message}</p>
            )}
            {serverErrors.readingDate && (
              <p className="text-xs text-red-500">{serverErrors.readingDate[0]}</p>
            )}
          </div>

          {/* Live units consumed preview */}
          {estimatedUnits !== null && (
            <div className="md:col-span-2 rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 p-3">
              <p className="text-sm text-green-800 dark:text-green-300">
                <span className="font-medium">Estimated Units Consumed: </span>
                <span className="text-lg font-bold">{estimatedUnits.toFixed(2)} kWh</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ToD breakdown (optional — for smart meters, Step 9) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Time-of-Day Breakdown{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (optional — for smart meters)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="dayUnits">Day Units — 6AM–6PM (kWh)</Label>
            <Input
              id="dayUnits"
              type="number"
              step="0.01"
              {...register("dayUnits", { valueAsNumber: true })}
              placeholder="e.g. 120"
            />
            {errors.dayUnits && (
              <p className="text-xs text-red-500">{errors.dayUnits.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="peakUnits">Peak Units — 6PM–10PM (kWh)</Label>
            <Input
              id="peakUnits"
              type="number"
              step="0.01"
              {...register("peakUnits", { valueAsNumber: true })}
              placeholder="e.g. 45"
            />
            {errors.peakUnits && (
              <p className="text-xs text-red-500">{errors.peakUnits.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="offPeakUnits">Off-Peak — 10PM–6AM (kWh)</Label>
            <Input
              id="offPeakUnits"
              type="number"
              step="0.01"
              {...register("offPeakUnits", { valueAsNumber: true })}
              placeholder="e.g. 30"
            />
            {errors.offPeakUnits && (
              <p className="text-xs text-red-500">{errors.offPeakUnits.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Reading"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/meter-readings/${consumerId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
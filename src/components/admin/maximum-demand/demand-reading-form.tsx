"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { demandReadingSchema, DemandReadingFormData } from "@/lib/validations/demand-reading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDemandReading } from "@/lib/actions/maximum-demand";

interface Props {
  consumerId: string;
  contractedDemandKW: number | null;
  consumerName: string;
  consumerNumber: string;
}

export function DemandReadingForm({
  consumerId,
  contractedDemandKW,
  consumerName,
  consumerNumber,
}: Props) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>(
    {}
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DemandReadingFormData>({
    resolver: zodResolver(demandReadingSchema),
    defaultValues: {
      readingDate: new Date().toISOString().slice(0, 10),
    },
  });

  const demandKW = watch("demandKW");
  const isExceeding =
    contractedDemandKW !== null &&
    demandKW > contractedDemandKW;

  async function handleFormSubmit(data: DemandReadingFormData) {
    setServerErrors({});
    const result = await addDemandReading(consumerId, data);
    if (!result.success && result.errors) {
      setServerErrors(result.errors as Record<string, string[]>);
      return;
    }
    router.push(`/admin/maximum-demand/${consumerId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {contractedDemandKW && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Consumer</span>
              <span className="font-medium">
                {consumerName} ({consumerNumber})
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Contracted Demand</span>
              <span className="font-bold">{contractedDemandKW} kW</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demand Reading</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="demandKW">Demand Reading (kW)</Label>
            <Input
              id="demandKW"
              type="number"
              step="0.1"
              {...register("demandKW", { valueAsNumber: true })}
              placeholder="e.g. 85.5"
            />
            {errors.demandKW && (
              <p className="text-xs text-red-500">{errors.demandKW.message}</p>
            )}
            {serverErrors.demandKW && (
              <p className="text-xs text-red-500">{serverErrors.demandKW[0]}</p>
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

          {/* Live excess warning */}
          {isExceeding && (
            <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-3">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ⚠ This reading exceeds the contracted demand of{" "}
                {contractedDemandKW} kW by{" "}
                {(demandKW - (contractedDemandKW ?? 0)).toFixed(1)} kW.
                Excess demand penalty will apply.
              </p>
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
          onClick={() =>
            router.push(`/admin/maximum-demand/${consumerId}`)
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
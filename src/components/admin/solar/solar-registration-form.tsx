"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  solarRegistrationSchema,
  SolarRegistrationFormData,
} from "@/lib/validations/solar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerSolarPlant } from "@/lib/actions/solar";
import { estimateSolarGeneration } from "@/lib/electrical/solar-net-metering";

type Consumer = {
  id: string;
  consumerNumber: string;
  consumerType: string;
  sanctionedLoad: number;
  user: { name: string };
};

export function SolarRegistrationForm({
  consumers,
}: {
  consumers: Consumer[];
}) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<
    Record<string, string[]>
  >({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SolarRegistrationFormData>({
    resolver: zodResolver(solarRegistrationSchema),
    defaultValues: {
      installationDate: new Date().toISOString().slice(0, 10),
    },
  });

  const capacity = watch("installedCapacityKW");
  const estimatedGen = capacity > 0
    ? estimateSolarGeneration(capacity)
    : null;

  async function handleFormSubmit(data: SolarRegistrationFormData) {
    setServerErrors({});
    const result = await registerSolarPlant(data);
    if (!result.success && result.errors) {
      setServerErrors(result.errors as Record<string, string[]>);
      return;
    }
    router.push("/admin/solar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solar Plant Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 md:col-span-2">
            <Label>Consumer</Label>
            <Select
              onValueChange={(v) => setValue("consumerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select consumer" />
              </SelectTrigger>
              <SelectContent>
                {consumers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.consumerNumber} — {c.user.name} ({c.consumerType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.consumerId && (
              <p className="text-xs text-red-500">
                {errors.consumerId.message}
              </p>
            )}
            {serverErrors.consumerId && (
              <p className="text-xs text-red-500">
                {serverErrors.consumerId[0]}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="installedCapacityKW">
              Installed Capacity (kW)
            </Label>
            <Input
              id="installedCapacityKW"
              type="number"
              step="0.1"
              {...register("installedCapacityKW", { valueAsNumber: true })}
              placeholder="e.g. 5"
            />
            <p className="text-xs text-muted-foreground">
              Typical residential: 3–10 kW
            </p>
            {errors.installedCapacityKW && (
              <p className="text-xs text-red-500">
                {errors.installedCapacityKW.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="installationDate">Installation Date</Label>
            <Input
              id="installationDate"
              type="date"
              {...register("installationDate")}
            />
            {errors.installationDate && (
              <p className="text-xs text-red-500">
                {errors.installationDate.message}
              </p>
            )}
          </div>

          {/* Estimated generation preview */}
          {estimatedGen !== null && (
            <div className="md:col-span-2 rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                  ☀ Estimated Monthly Generation
                </span>
                <span className="font-bold text-yellow-800 dark:text-yellow-300 text-lg">
                  {estimatedGen} kWh
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {capacity} kW × 5 peak sun hours × 30 days × 80%
                efficiency
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register Solar Plant"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/solar")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
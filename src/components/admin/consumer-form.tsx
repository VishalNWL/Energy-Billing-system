"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consumerSchema, ConsumerFormData } from "@/lib/validations/consumer";
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

type Transformer = {
  id: string;
  transformerName: string;
  feeder: { feederName: string };
};

interface ConsumerFormProps {
  defaultValues?: Partial<ConsumerFormData>;
  transformers: Transformer[];
  onSubmit: (data: ConsumerFormData) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  mode: "create" | "edit";
}

export function ConsumerForm({
  defaultValues,
  transformers,
  onSubmit,
  mode,
}: ConsumerFormProps) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConsumerFormData>({
    resolver: zodResolver(consumerSchema),
    defaultValues,
  });

  async function handleFormSubmit(data: ConsumerFormData) {
    setServerErrors({});
    const result = await onSubmit(data);

    if (!result.success && result.errors) {
      setServerErrors(result.errors);
      return;
    }

    router.push("/admin/consumers");
    router.refresh();
  }

  const consumerType = watch("consumerType");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* ── Account Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Rajesh Kumar" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            {serverErrors.name && <p className="text-xs text-red-500">{serverErrors.name[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register("email")} placeholder="consumer@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            {serverErrors.email && <p className="text-xs text-red-500">{serverErrors.email[0]}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Connection Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="consumerNumber">Consumer Number</Label>
            <Input id="consumerNumber" {...register("consumerNumber")} placeholder="e.g. RES-001" />
            {errors.consumerNumber && <p className="text-xs text-red-500">{errors.consumerNumber.message}</p>}
            {serverErrors.consumerNumber && <p className="text-xs text-red-500">{serverErrors.consumerNumber[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="meterNumber">Meter Number</Label>
            <Input id="meterNumber" {...register("meterNumber")} placeholder="e.g. MTR-001" />
            {errors.meterNumber && <p className="text-xs text-red-500">{errors.meterNumber.message}</p>}
            {serverErrors.meterNumber && <p className="text-xs text-red-500">{serverErrors.meterNumber[0]}</p>}
          </div>

          <div className="space-y-1">
            <Label>Consumer Type</Label>
            <Select
              value={consumerType}
              onValueChange={(v) => setValue("consumerType", v as ConsumerFormData["consumerType"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
              </SelectContent>
            </Select>
            {errors.consumerType && <p className="text-xs text-red-500">{errors.consumerType.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} placeholder="Full address" />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Electrical Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Electrical Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="sanctionedLoad">Sanctioned Load (kW)</Label>
            <Input
              id="sanctionedLoad"
              type="number"
              step="0.1"
              {...register("sanctionedLoad", { valueAsNumber: true })}
              placeholder="e.g. 5"
            />
            {errors.sanctionedLoad && <p className="text-xs text-red-500">{errors.sanctionedLoad.message}</p>}
          </div>

          {(consumerType === "COMMERCIAL" || consumerType === "INDUSTRIAL") && (
            <div className="space-y-1">
              <Label htmlFor="contractedDemand">Contracted Demand (kVA)</Label>
              <Input
                id="contractedDemand"
                type="number"
                step="0.1"
                {...register("contractedDemand", { valueAsNumber: true })}
                placeholder="e.g. 50"
              />
              {errors.contractedDemand && <p className="text-xs text-red-500">{errors.contractedDemand.message}</p>}
            </div>
          )}

          <div className="space-y-1 md:col-span-2">
            <Label>Connected Transformer</Label>
            <Select
              onValueChange={(v) => setValue("connectedTransformerId", v)}
              defaultValue={defaultValues?.connectedTransformerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transformer (optional)" />
              </SelectTrigger>
              <SelectContent>
                {transformers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.transformerName} — Feeder: {t.feeder.feederName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Add Consumer" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/consumers")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateTodBillAction } from "@/lib/actions/tod-billing";
import type { TodBillBreakdown } from "@/lib/billing/tod-tariff";

type ConsumerOption = {
  consumerId: string;
  consumerNumber: string;
  consumerType: string;
  name: string;
  lastTodReading: Date | null;
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const TOD_RATES_DISPLAY = [
  { slot: "Day (6AM–6PM)", rate: "₹6/unit", color: "bg-blue-100 text-blue-800" },
  { slot: "Peak (6PM–10PM)", rate: "₹9/unit", color: "bg-red-100 text-red-800" },
  { slot: "Off-Peak (10PM–6AM)", rate: "₹5/unit", color: "bg-green-100 text-green-800" },
];

export function TodBillForm({ consumers }: { consumers: ConsumerOption[] }) {
  const [consumerId, setConsumerId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
const [result, setResult] = useState<
  | { success: true; breakdown: TodBillBreakdown }
  | { success: false; error: string }
  | null
>(null);

  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!consumerId) return;
    setResult(null);
    startTransition(async () => {
      const res = await generateTodBillAction(
        consumerId,
        parseInt(month),
        parseInt(year)
      );
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {/* Tariff reference card */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Current ToD Tariff Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {TOD_RATES_DISPLAY.map(({ slot, rate, color }) => (
              <div
                key={slot}
                className={`rounded-lg p-3 text-center ${color}`}
              >
                <p className="text-xs font-medium">{slot}</p>
                <p className="text-xl font-bold mt-1">{rate}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generator form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate ToD Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consumers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No consumers have ToD meter readings yet. Add day/peak/off-peak
              values when recording meter readings (Step 6).
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Consumer</Label>
                  <Select value={consumerId} onValueChange={setConsumerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select consumer" />
                    </SelectTrigger>
                    <SelectContent>
                      {consumers.map((c) => (
                        <SelectItem key={c.consumerId} value={c.consumerId}>
                          {c.consumerNumber} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Billing Month</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Billing Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isPending || !consumerId}
              >
                {isPending ? "Calculating..." : "Calculate ToD Bill"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <>
          {!result.success ? (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {result.error}
                </p>
              </CardContent>
            </Card>
          ) : (
            <TodBillResult breakdown={result.breakdown} />
          )}
        </>
      )}
    </div>
  );
}

function TodBillResult({ breakdown }: { breakdown: TodBillBreakdown }) {
  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <Card className="border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            ToD Bill — {MONTH_NAMES[breakdown.billingMonth - 1]}{" "}
            {breakdown.billingYear}
          </CardTitle>
          <div className="flex gap-2">
            <Badge>{breakdown.consumerType}</Badge>
            {!breakdown.hasCompleteTodData && (
              <Badge variant="secondary">Partial ToD Data</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unit breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Day Units",
              sublabel: "6AM–6PM",
              units: breakdown.dayUnits,
              charge: breakdown.dayCharge,
              rate: "₹6",
              color: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
            },
            {
              label: "Peak Units",
              sublabel: "6PM–10PM",
              units: breakdown.peakUnits,
              charge: breakdown.peakCharge,
              rate: "₹9",
              color: "border-red-200 bg-red-50 dark:bg-red-950/20",
            },
            {
              label: "Off-Peak Units",
              sublabel: "10PM–6AM",
              units: breakdown.offPeakUnits,
              charge: breakdown.offPeakCharge,
              rate: "₹5",
              color: "border-green-200 bg-green-50 dark:bg-green-950/20",
            },
          ].map(({ label, sublabel, units, charge, rate, color }) => (
            <div key={label} className={`rounded-lg border p-3 ${color}`}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{sublabel}</p>
              <p className="text-2xl font-bold mt-1">{units} kWh</p>
              <p className="text-sm font-medium mt-1">
                {rate}/unit = ₹{charge}
              </p>
            </div>
          ))}
        </div>

        {/* Charge summary */}
        <div className="border rounded-lg divide-y text-sm">
          {[
            { label: "Energy Charge", value: `₹${breakdown.energyCharge}` },
            { label: "Fixed Charge", value: `₹${breakdown.fixedCharge}` },
            { label: "Tax (5%)", value: `₹${breakdown.taxAmount}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-2">
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-bold text-base">
            <span>Total Amount</span>
            <span>₹{breakdown.totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Comparison note */}
        <p className="text-xs text-muted-foreground">
          Based on {breakdown.readingsUsed} reading(s) —{" "}
          {breakdown.totalUnits} total kWh across all slots.
        </p>
      </CardContent>
    </Card>
  );
}
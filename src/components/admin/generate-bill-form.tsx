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
import { generateSingleBill, generateBulkBills } from "@/lib/actions/billing";

type Consumer = { id: string; consumerNumber: string; user: { name: string } };

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

export function GenerateBillForm({ consumers }: { consumers: Consumer[] }) {
  const [consumerId, setConsumerId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [result, setResult] = useState<null | {
    success: boolean;
    message: string;
    breakdown?: Record<string, unknown>;
  }>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setResult(null);
    startTransition(async () => {
      if (mode === "single") {
        if (!consumerId) {
          setResult({ success: false, message: "Please select a consumer." });
          return;
        }
        const res = await generateSingleBill(consumerId, parseInt(month), parseInt(year));
        if (res.success) {
          setResult({
            success: true,
            message: `Bill generated successfully for ${MONTHS[parseInt(month) - 1]} ${year}.`,
            breakdown: res.bill as unknown as Record<string, unknown>,
          });
        } else {
          setResult({ success: false, message: res.message });
        }
      } else {
        const summary = await generateBulkBills(parseInt(month), parseInt(year));
        setResult({
          success: true,
          message: `Bulk generation complete: ${summary.success} generated, ${summary.skipped} skipped, ${summary.failed} failed.`,
          breakdown: summary as unknown as Record<string, unknown>,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "single" ? "default" : "outline"}
          onClick={() => setMode("single")}
        >
          Single Consumer
        </Button>
        <Button
          variant={mode === "bulk" ? "default" : "outline"}
          onClick={() => setMode("bulk")}
        >
          Bulk — All Consumers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "single" ? "Generate Bill for Consumer" : "Bulk Bill Generation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mode === "single" && (
              <div className="space-y-1 md:col-span-1">
                <Label>Consumer</Label>
                <Select value={consumerId} onValueChange={setConsumerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select consumer" />
                  </SelectTrigger>
                  <SelectContent>
                    {consumers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.consumerNumber} — {c.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate Bill"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={result.success
          ? "border-green-200 bg-green-50 dark:bg-green-950/20"
          : "border-red-200 bg-red-50 dark:bg-red-950/20"
        }>
          <CardContent className="pt-4 space-y-4">
            <p className={`font-medium text-sm ${result.success ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
              {result.message}
            </p>

            {result.success && result.breakdown && mode === "single" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { label: "Units Consumed", value: `${(result.breakdown as { unitsConsumed: number }).unitsConsumed} kWh` },
                  { label: "Energy Charge", value: `₹${(result.breakdown as { energyCharge: number }).energyCharge}` },
                  { label: "Fixed Charge", value: `₹${(result.breakdown as { fixedCharge: number }).fixedCharge}` },
                  { label: "Demand Charge", value: `₹${(result.breakdown as { demandCharge: number }).demandCharge}` },
                  { label: "Solar Adj.", value: `−₹${(result.breakdown as { solarAdjustment: number }).solarAdjustment}` },
                  { label: "PF Penalty", value: `₹${(result.breakdown as { powerFactorPenalty: number }).powerFactorPenalty}` },
                  { label: "Tax (5%)", value: `₹${(result.breakdown as { taxAmount: number }).taxAmount}` },
                  { label: "Total", value: `₹${(result.breakdown as { totalAmount: number }).totalAmount}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded border px-3 py-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-bold">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
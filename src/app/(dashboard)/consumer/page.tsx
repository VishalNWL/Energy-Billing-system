import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/admin/reports/download-button";
import { Zap, FileText, Gauge, Sun, AlertTriangle } from "lucide-react";
import Link from "next/link";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PAID: "default",
  PENDING: "secondary",
  OVERDUE: "destructive",
};

export default async function ConsumerDashboard() {
  const dbUser = await requireRole(["CONSUMER", "ADMIN"]);

  const consumer = await prisma.consumer.findUnique({
    where: { userId: dbUser.id },
    include: {
      user: { select: { name: true, email: true } },
      meter: {
        include: {
          readings: {
            orderBy: { readingDate: "desc" },
            take: 6,
          },
        },
      },
      transformer: {
        include: { feeder: { select: { feederName: true } } },
      },
      solarPlant: true,
      bills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        take: 6,
      },
    },
  });

  if (!consumer) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <h1 className="text-2xl font-bold">No Consumer Account Found</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Your account hasn't been linked to a consumer record yet.
          Please contact your DISCOM administrator to complete your
          registration.
        </p>
      </div>
    );
  }

  const latestBill = consumer.bills[0] ?? null;
  const previousBill = consumer.bills[1] ?? null;

  // Compute latest reading delta
  const readings = consumer.meter?.readings ?? [];
  const latestReading = readings[0] ?? null;
  const previousReading = readings[1] ?? null;
  const unitsConsumed =
    latestReading && previousReading
      ? parseFloat(
          (latestReading.reading - previousReading.reading).toFixed(2)
        )
      : null;

  // Consumption trend (increase/decrease vs previous bill)
  const consumptionChange =
    latestBill && previousBill
      ? parseFloat(
          (
            ((latestBill.unitsConsumed - previousBill.unitsConsumed) /
              previousBill.unitsConsumed) *
            100
          ).toFixed(1)
        )
      : null;

  const totalPaid = consumer.bills
    .filter((b) => b.status === "PAID")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const overdueBills = consumer.bills.filter((b) => b.status === "OVERDUE");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">

      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome, {consumer.user.name}
        </h1>
        <p className="text-muted-foreground">
          Consumer #{consumer.consumerNumber} — {consumer.consumerType}
        </p>
      </div>

      {/* Overdue alert */}
      {overdueBills.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                You have {overdueBills.length} overdue bill(s) totalling{" "}
                ₹{overdueBills
                  .reduce((s, b) => s + b.totalAmount, 0)
                  .toLocaleString("en-IN")}
                . Please pay immediately to avoid disconnection.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Current Bill</span>
            </div>
            {latestBill ? (
              <>
                <p className="text-2xl font-bold">
                  ₹{latestBill.totalAmount.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={STATUS_VARIANT[latestBill.status]}>
                    {latestBill.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {MONTH_NAMES[latestBill.billingMonth - 1]}{" "}
                    {latestBill.billingYear}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No bills yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Last Reading</span>
            </div>
            {unitsConsumed !== null ? (
              <>
                <p className="text-2xl font-bold">{unitsConsumed} kWh</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Units consumed
                </p>
              </>
            ) : latestReading ? (
              <>
                <p className="text-2xl font-bold">
                  {latestReading.reading} kWh
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Meter reading
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No readings yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="w-4 h-4" />
              <span className="text-xs">Sanctioned Load</span>
            </div>
            <p className="text-2xl font-bold">
              {consumer.sanctionedLoad} kW
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {consumer.transformer?.transformerName ?? "Unassigned"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sun className="w-4 h-4" />
              <span className="text-xs">Solar Plant</span>
            </div>
            {consumer.solarPlant ? (
              <>
                <p className="text-2xl font-bold text-yellow-600">
                  {consumer.solarPlant.installedCapacityKW} kW
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {consumer.solarPlant.generatedUnits} kWh generated
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Not installed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Meter Number", value: consumer.meter?.meterNumber ?? "—" },
            { label: "Consumer Type", value: consumer.consumerType },
            { label: "Transformer", value: consumer.transformer?.transformerName ?? "—" },
            { label: "Feeder", value: consumer.transformer?.feeder.feederName ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent bills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Bills</CardTitle>
            {consumptionChange !== null && (
              <span
                className={`text-xs font-medium ${
                  consumptionChange > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {consumptionChange > 0 ? "↑" : "↓"}{" "}
                {Math.abs(consumptionChange)}% vs last month
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {consumer.bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bills generated yet.
            </p>
          ) : (
            consumer.bills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {MONTH_NAMES[bill.billingMonth - 1]} {bill.billingYear}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bill.unitsConsumed} kWh consumed
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold">
                      ₹{bill.totalAmount.toLocaleString("en-IN")}
                    </p>
                    {bill.dueDate && bill.status === "PENDING" && (
                      <p className="text-xs text-muted-foreground">
                        Due{" "}
                        {new Date(bill.dueDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[bill.status]}>
                    {bill.status}
                  </Badge>
                  <DownloadButton
                    url={`/api/reports/bill/${bill.id}`}
                    filename={`bill-${consumer.consumerNumber}-${bill.billingMonth}-${bill.billingYear}.pdf`}
                    label="PDF"
                    size="sm"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Meter readings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Meter Readings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {readings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No readings recorded yet.
            </p>
          ) : (
            readings.map((r, index) => {
              const prev = readings[index + 1];
              const delta = prev
                ? parseFloat((r.reading - prev.reading).toFixed(2))
                : null;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-mono font-bold">{r.reading} kWh</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.readingDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {delta !== null ? (
                    <Badge variant={delta > 500 ? "destructive" : "default"}>
                      {delta} kWh used
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      First reading
                    </span>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <DownloadButton
            url={`/api/reports/consumer/${consumer.id}`}
            filename={`consumer-report-${consumer.consumerNumber}.pdf`}
            label="Download My Report"
          />
          <DownloadButton
            url={`/api/reports/audit/${consumer.id}`}
            filename={`energy-audit-${consumer.consumerNumber}.pdf`}
            label="Download Energy Audit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
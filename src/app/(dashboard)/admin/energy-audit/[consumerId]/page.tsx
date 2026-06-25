import { requireRole } from "@/lib/auth";
import { getConsumerEnergyAudit } from "@/lib/actions/energy-audit";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuditScoreCard } from "@/components/admin/energy-audit/audit-score-card";
import { RecommendationsList } from "@/components/admin/energy-audit/recommendations-list";
import { AuditConsumptionChart } from "@/components/admin/energy-audit/consumption-chart";
import Link from "next/link";
import { ClipboardList, Sun } from "lucide-react";
import { DownloadButton } from "@/components/admin/reports/download-button";

export default async function ConsumerEnergyAuditPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const data = await getConsumerEnergyAudit(consumerId);
  if (!data) notFound();

  const {
    consumer,
    totalUnits,
    totalRevenue,
    avgMonthlyUnits,
    avgMonthlyBill,
    maxDemandKW,
    avgDemandKW,
    loadFactor,
    avgPF,
    hasSolar,
    monthlyConsumption,
    score,
    recommendations,
  } = data;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Energy Audit Report</h1>
            <p className="text-muted-foreground">
              {consumer.user.name} — {consumer.consumerNumber}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/energy-audit">← Back</Link>
        </Button>
      </div>

      {/* Consumer info strip */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Consumer Type", value: consumer.consumerType },
              {
                label: "Meter",
                value: consumer.meter?.meterNumber ?? "—",
              },
              {
                label: "Transformer",
                value: consumer.transformer?.transformerName ?? "—",
              },
              {
                label: "Feeder",
                value:
                  consumer.transformer?.feeder.feederName ?? "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Consumption",
            value: `${totalUnits.toFixed(0)} kWh`,
            sub: `${consumer.bills.length} months`,
            color: "text-blue-600",
          },
          {
            label: "Total Billed",
            value: `₹${totalRevenue.toLocaleString("en-IN")}`,
            sub: `Avg ₹${avgMonthlyBill.toLocaleString("en-IN")}/mo`,
            color: "text-green-600",
          },
          {
            label: "Peak Demand",
            value: maxDemandKW > 0 ? `${maxDemandKW} kW` : "No data",
            sub: `Avg ${avgDemandKW} kW`,
            color: "text-red-600",
          },
          {
            label: "Load Factor",
            value: loadFactor > 0 ? loadFactor : "No data",
            sub:
              loadFactor >= 0.8
                ? "Excellent"
                : loadFactor >= 0.6
                ? "Good"
                : loadFactor > 0
                ? "Poor"
                : "—",
            color:
              loadFactor >= 0.8
                ? "text-green-600"
                : loadFactor >= 0.6
                ? "text-yellow-600"
                : "text-red-600",
          },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PF + Solar status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Avg Power Factor
                </p>
                <p
                  className={`text-3xl font-bold ${
                    avgPF >= 0.9 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {avgPF}
                </p>
              </div>
              <Badge variant={avgPF >= 0.9 ? "default" : "destructive"}>
                {avgPF >= 0.9 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Solar Status
                </p>
                <p className="text-xl font-bold">
                  {hasSolar
                    ? `${consumer.solarPlant?.installedCapacityKW} kW Installed`
                    : "No Solar Plant"}
                </p>
              </div>
              {hasSolar ? (
                <Sun className="w-8 h-8 text-yellow-500" />
              ) : (
                <Badge variant="secondary">Not Installed</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit score */}
      <AuditScoreCard score={score} />

      {/* Consumption chart */}
      <AuditConsumptionChart data={monthlyConsumption} />

      {/* Recommendations */}
      <RecommendationsList recommendations={recommendations} />

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Related Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "PF Correction Calculator",
                href: "/admin/pf-correction",
              },
              {
                label: "Load Analysis",
                href: `/admin/load-analysis/${consumerId}`,
              },
              {
                label: "Demand History",
                href: `/admin/maximum-demand/${consumerId}`,
              },
              {
                label: "PF History",
                href: `/admin/power-factor/${consumerId}`,
              },
              hasSolar
                ? {
                    label: "Solar Dashboard",
                    href: `/admin/solar/${consumerId}`,
                  }
                : {
                    label: "Register Solar",
                    href: "/admin/solar/register",
                  },
            ].map(({ label, href }) => (
              <Button key={href} asChild size="sm" variant="outline">
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <DownloadButton
      url={`/api/reports/audit/${consumerId}`}
      filename={`audit-${data.consumer.consumerNumber}.pdf`}
      label="Download Audit Report PDF"
      variant="default"
    />
    </div>
  );
}
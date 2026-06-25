import { requireRole } from "@/lib/auth";
import {
  getLoadAnalysisData,
  getAllConsumersForLoadAnalysis,
} from "@/lib/queries/load-analysis";
import { notFound } from "next/navigation";
import { DailyLoadChart } from "@/components/admin/load-analysis/daily-load-chart";
import { WeeklyLoadChart } from "@/components/admin/load-analysis/weekly-load-chart";
import { MonthlyLoadChart } from "@/components/admin/load-analysis/monthly-load-chart";
import { LoadSummaryCards } from "@/components/admin/load-analysis/load-summary-cards";
import { ConsumerSelector } from "@/components/admin/load-analysis/consumer-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ConsumerLoadAnalysisPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const [data, allConsumers] = await Promise.all([
    getLoadAnalysisData(consumerId),
    getAllConsumersForLoadAnalysis(),
  ]);

  if (!data) notFound();

  const TYPE_COLOR: Record<string, "default" | "secondary" | "destructive"> = {
    RESIDENTIAL: "default",
    COMMERCIAL: "secondary",
    INDUSTRIAL: "destructive",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {data.consumer.user.name}
            </h1>
            <Badge variant={TYPE_COLOR[data.consumer.consumerType]}>
              {data.consumer.consumerType}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {data.consumer.consumerNumber} — Meter:{" "}
            <span className="font-mono">{data.meterNumber}</span>
          </p>
        </div>
        <Card>
          <CardContent className="pt-4">
            <ConsumerSelector
              consumers={allConsumers}
              selectedId={consumerId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Summary cards */}
      <LoadSummaryCards
        totalReadings={data.totalReadings}
        sanctionedLoad={data.sanctionedLoad}
        loadFactor={data.loadFactor}
        peak={data.peak}
      />

      {/* Charts */}
      <DailyLoadChart
        data={data.dailyLoad}
        sanctionedLoad={data.sanctionedLoad}
        peakDate={data.peak?.date}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyLoadChart data={data.weeklyLoad} />
        <MonthlyLoadChart data={data.monthlyLoad} />
      </div>
    </div>
  );
}
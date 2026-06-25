import { requireRole } from "@/lib/auth";
import { getDemandAnalysisForConsumer } from "@/lib/actions/maximum-demand";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemandTrendChart } from "@/components/admin/maximum-demand/demand-trend-chart";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ConsumerDemandPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const data = await getDemandAnalysisForConsumer(consumerId);
  if (!data) notFound();

  const { consumer, analysis } = data;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maximum Demand Analysis</h1>
          <p className="text-muted-foreground">
            {consumer.user.name} — {consumer.consumerNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/maximum-demand/${consumerId}/new`}>
              <Plus className="w-4 h-4 mr-2" /> Add Reading
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/maximum-demand">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Alert if exceeding */}
      {analysis.isExceeding && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 text-sm text-red-700 dark:text-red-300">
            <strong>⚠ Contracted demand exceeded by {analysis.excessDemandKW} kW.</strong>{" "}
            Excess demand penalty of ₹{analysis.excessDemandPenalty.toLocaleString("en-IN")} applies.
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Max Demand",
            value: `${analysis.maxDemandKW} kW`,
            color: "text-red-600",
          },
          {
            label: "Avg Demand",
            value: `${analysis.avgDemandKW} kW`,
            color: "text-blue-600",
          },
          {
            label: "Min Demand",
            value: `${analysis.minDemandKW} kW`,
            color: "text-green-600",
          },
          {
            label: "Load Factor",
            value: analysis.loadFactor,
            color:
              analysis.loadFactor >= 0.8
                ? "text-green-600"
                : "text-yellow-600",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demand charge card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Contracted Demand",
            value: analysis.contractedDemandKW
              ? `${analysis.contractedDemandKW} kW`
              : "Not set",
          },
          {
            label: "Demand Charge",
            value: `₹${analysis.demandCharge.toLocaleString("en-IN")}`,
          },
          {
            label: "Excess Penalty",
            value:
              analysis.excessDemandPenalty > 0
                ? `₹${analysis.excessDemandPenalty.toLocaleString("en-IN")}`
                : "None",
          },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart */}
      <DemandTrendChart
        data={analysis.readings}
        contractedDemandKW={analysis.contractedDemandKW}
        avgDemandKW={analysis.avgDemandKW}
      />

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reading History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Demand (kW)</TableHead>
                <TableHead>vs Contracted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.readings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No readings yet.
                  </TableCell>
                </TableRow>
              )}
              {analysis.readings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <span
                      className={
                        r.isMax ? "font-bold text-red-600" : "font-medium"
                      }
                    >
                      {r.demandKW} kW
                      {r.isMax && (
                        <span className="ml-1 text-xs">★ Peak</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {analysis.contractedDemandKW ? (
                      <span
                        className={
                          r.exceedsContract
                            ? "text-red-600 font-medium"
                            : "text-green-600"
                        }
                      >
                        {r.exceedsContract
                          ? `+${(r.demandKW - analysis.contractedDemandKW).toFixed(1)} kW over`
                          : `${(analysis.contractedDemandKW - r.demandKW).toFixed(1)} kW under`}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {r.exceedsContract ? (
                      <Badge variant="destructive">Exceeding</Badge>
                    ) : r.isMax ? (
                      <Badge variant="secondary">Peak</Badge>
                    ) : (
                      <Badge variant="default">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
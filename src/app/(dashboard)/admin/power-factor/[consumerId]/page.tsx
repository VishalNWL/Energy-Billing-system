import { requireRole } from "@/lib/auth";
import { getPFReadingsForConsumer } from "@/lib/actions/power-factor";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PFTrendChart } from "@/components/admin/power-factor/pf-trend-chart";
import { PFGauge } from "@/components/admin/power-factor/pf-gauge";
import {
  calculatePowerFactor,
  getPFStatusConfig,
} from "@/lib/electrical/power-factor";
import { Plus } from "lucide-react";

export default async function ConsumerPFHistoryPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const [consumer, readings] = await Promise.all([
    prisma.consumer.findUnique({
      where: { id: consumerId },
      include: { user: { select: { name: true } } },
    }),
    getPFReadingsForConsumer(consumerId),
  ]);

  if (!consumer) notFound();

  const latestCalc =
    readings.length > 0
      ? calculatePowerFactor(
          readings[0].activePowerKW,
          readings[0].reactivePowerKVAR
        )
      : null;

  const trendData = [...readings].reverse().map((r) => ({
    date: new Date(r.readingDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    pf: r.powerFactor,
    kw: r.activePowerKW,
    kvar: r.reactivePowerKVAR,
  }));

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Power Factor History</h1>
          <p className="text-muted-foreground">
            {consumer.user.name} — {consumer.consumerNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/power-factor/${consumerId}/new`}>
              <Plus className="w-4 h-4 mr-2" /> Add Reading
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/power-factor">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Latest PF status */}
      {latestCalc && (
        <Card
          className={`border ${getPFStatusConfig(latestCalc.status).border} ${getPFStatusConfig(latestCalc.status).bg}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Power Factor</CardTitle>
              <Badge variant={getPFStatusConfig(latestCalc.status).badge}>
                {getPFStatusConfig(latestCalc.status).label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <PFGauge
                powerFactor={latestCalc.powerFactor}
                status={latestCalc.status}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm flex-1">
                {[
                  { label: "Active Power", value: `${latestCalc.activePowerKW} kW` },
                  { label: "Reactive Power", value: `${latestCalc.reactivePowerKVAR} kVAR` },
                  { label: "Apparent Power", value: `${latestCalc.apparentPowerKVA} kVA` },
                  { label: "Penalty", value: latestCalc.penaltyPercent > 0 ? `${latestCalc.penaltyPercent}%` : "None" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend chart */}
      {trendData.length > 1 && <PFTrendChart data={trendData} />}

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
                <TableHead>kW</TableHead>
                <TableHead>kVAR</TableHead>
                <TableHead>kVA</TableHead>
                <TableHead>Power Factor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penalty %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No readings yet.
                  </TableCell>
                </TableRow>
              )}
              {readings.map((r) => {
                const calc = calculatePowerFactor(
                  r.activePowerKW,
                  r.reactivePowerKVAR
                );
                const config = getPFStatusConfig(calc.status);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.readingDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{r.activePowerKW}</TableCell>
                    <TableCell>{r.reactivePowerKVAR}</TableCell>
                    <TableCell>{calc.apparentPowerKVA}</TableCell>
                    <TableCell className="font-bold">
                      {calc.powerFactor.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {calc.penaltyPercent > 0 ? (
                        <span className="text-red-600 font-medium">
                          {calc.penaltyPercent}%
                        </span>
                      ) : (
                        <span className="text-green-600 text-sm">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
import { requireRole } from "@/lib/auth";
import { getFeederDetail, getAllFeedersWithLoss } from "@/lib/actions/feeder";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeederLossChart } from "@/components/admin/feeders/feeder-loss-chart";
import {
  calculateFeederLoss,
  getLossStatusConfig,
} from "@/lib/electrical/feeder-loss";
import Link from "next/link";
import { Plus, GitBranch } from "lucide-react";

const TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  RESIDENTIAL: "default",
  COMMERCIAL: "secondary",
  INDUSTRIAL: "destructive",
};

export default async function FeederDetailPage({
  params,
}: {
  params: Promise<{ feederId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { feederId } = await params;

  const [data, allFeeders] = await Promise.all([
    getFeederDetail(feederId),
    getAllFeedersWithLoss(),
  ]);

  if (!data) notFound();

  const { feeder, lossTrend } = data;

  // Current loss — from latest reading
  const latestReading = feeder.energyReadings[0];
  const totalBilledKWh = feeder.transformers
    .flatMap((t) => t.consumers)
    .flatMap((c) => c.bills)
    .reduce((sum, b) => sum + b.unitsConsumed, 0);

  const currentLoss = latestReading
    ? calculateFeederLoss(
        latestReading.energySuppliedKWh,
        latestReading.energyBilledKWh ?? totalBilledKWh
      )
    : null;

  const config = currentLoss
    ? getLossStatusConfig(currentLoss.status)
    : null;

  const allConsumers = feeder.transformers.flatMap((t) =>
    t.consumers.map((c) => ({ ...c, transformerName: t.transformerName }))
  );

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">{feeder.feederName}</h1>
            <p className="text-muted-foreground">
              Capacity: {feeder.capacityKW} kW —{" "}
              {feeder.transformers.length} transformer(s)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/feeders/${feederId}/readings/new`}>
              <Plus className="w-4 h-4 mr-2" /> Add Reading
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/feeders">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Current loss status */}
      {currentLoss && config && (
        <Card className={`border ${config.border} ${config.bg}`}>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                {
                  label: "Energy Supplied",
                  value: `${latestReading!.energySuppliedKWh.toLocaleString("en-IN")} kWh`,
                },
                {
                  label: "Energy Billed",
                  value: `${(latestReading!.energyBilledKWh ?? totalBilledKWh).toLocaleString("en-IN")} kWh`,
                },
                {
                  label: "Distribution Loss",
                  value: `${currentLoss.lossKWh.toLocaleString("en-IN")} kWh`,
                },
                {
                  label: "Loss %",
                  value: (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${config.color}`}
                      >
                        {currentLoss.lossPercent}%
                      </span>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </div>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="font-bold mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!latestReading && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 text-sm text-yellow-700 dark:text-yellow-300">
            No feeder energy reading recorded yet. Add a reading to calculate
            distribution losses.
          </CardContent>
        </Card>
      )}

      {/* Loss trend chart */}
      <FeederLossChart data={lossTrend} />

      {/* Transformers under this feeder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Transformers ({feeder.transformers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {feeder.transformers.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border rounded-md px-4 py-2 text-sm"
              >
                <span className="font-medium">{t.transformerName}</span>
                <span className="text-muted-foreground">
                  {t.capacityKVA} kVA
                </span>
                <span>{t.consumers.length} consumers</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/transformers/${t.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All consumers under feeder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Consumers ({allConsumers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Transformer</TableHead>
                <TableHead>Sanctioned Load</TableHead>
                <TableHead>Total Billed Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allConsumers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No consumers under this feeder.
                  </TableCell>
                </TableRow>
              )}
              {allConsumers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">
                    {c.consumerNumber}
                  </TableCell>
                  <TableCell>{c.user.name}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[c.consumerType]}>
                      {c.consumerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.transformerName}
                  </TableCell>
                  <TableCell>{c.sanctionedLoad} kW</TableCell>
                  <TableCell>
                    {c.bills
                      .reduce((sum, b) => sum + b.unitsConsumed, 0)
                      .toFixed(1)}{" "}
                    kWh
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
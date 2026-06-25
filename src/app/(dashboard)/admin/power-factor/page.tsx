import { requireRole } from "@/lib/auth";
import { getAllLatestPFReadings, getConsumersForPF } from "@/lib/actions/power-factor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  calculatePowerFactor,
  getPFStatusConfig,
} from "@/lib/electrical/power-factor";
import { Zap } from "lucide-react";

export default async function PowerFactorPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const [readings, consumers] = await Promise.all([
    getAllLatestPFReadings(),
    getConsumersForPF(),
  ]);

  const criticalCount = readings.filter((r) => {
    if (!r.latestReading) return false;
    const calc = calculatePowerFactor(
      r.latestReading.activePowerKW,
      r.latestReading.reactivePowerKVAR
    );
    return calc.status === "CRITICAL" || calc.status === "PENALTY";
  }).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-8 h-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Power Factor Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor reactive power and PF penalties across all consumers.
          </p>
        </div>
      </div>

      {criticalCount > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <p className="text-red-700 dark:text-red-300 font-medium text-sm">
              ⚠ {criticalCount} consumer(s) have poor power factor and are
              incurring penalties. Consider recommending capacitor bank
              installation.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Latest PF Readings by Consumer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>kW</TableHead>
                <TableHead>kVAR</TableHead>
                <TableHead>kVA</TableHead>
                <TableHead>Power Factor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penalty %</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No PF readings recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {readings.map((r) => {
                const calc = r.latestReading
                  ? calculatePowerFactor(
                      r.latestReading.activePowerKW,
                      r.latestReading.reactivePowerKVAR
                    )
                  : null;
                const config = calc
                  ? getPFStatusConfig(calc.status)
                  : null;

                return (
                  <TableRow key={r.consumerId}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {r.consumerNumber}
                      </div>
                    </TableCell>
                    <TableCell>{r.consumerType}</TableCell>
                    <TableCell>
                      {r.latestReading?.activePowerKW ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.latestReading?.reactivePowerKVAR ?? "—"}
                    </TableCell>
                    <TableCell>{calc?.apparentPowerKVA ?? "—"}</TableCell>
                    <TableCell className="font-bold">
                      {calc?.powerFactor.toFixed(3) ?? "—"}
                    </TableCell>
                    <TableCell>
                      {config && (
                        <Badge variant={config.badge}>{config.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {calc && calc.penaltyPercent > 0 ? (
                        <span className="text-red-600 font-medium">
                          {calc.penaltyPercent}%
                        </span>
                      ) : (
                        <span className="text-green-600">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/power-factor/${r.consumerId}`}>
                            History
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link
                            href={`/admin/power-factor/${r.consumerId}/new`}
                          >
                            Add
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick add for consumers without readings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Add Reading for Consumer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {consumers.map((c) => (
              <Button key={c.id} asChild size="sm" variant="outline">
                <Link href={`/admin/power-factor/${c.id}/new`}>
                  {c.consumerNumber}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
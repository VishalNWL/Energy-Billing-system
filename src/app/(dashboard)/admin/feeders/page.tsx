import { requireRole } from "@/lib/auth";
import { getAllFeedersWithLoss } from "@/lib/actions/feeder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLossStatusConfig } from "@/lib/electrical/feeder-loss";
import Link from "next/link";
import { GitBranch, AlertTriangle } from "lucide-react";

export default async function FeedersPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const feeders = await getAllFeedersWithLoss();

  const critical = feeders.filter((f) => f.status === "CRITICAL");
  const warning = feeders.filter((f) => f.status === "WARNING");

  const totalSupplied = feeders.reduce(
    (sum, f) => sum + f.energySuppliedKWh,
    0
  );
  const totalBilled = feeders.reduce(
    (sum, f) => sum + f.energyBilledKWh,
    0
  );
  const totalLoss = parseFloat(
    Math.max(0, totalSupplied - totalBilled).toFixed(2)
  );
  const systemLossPercent =
    totalSupplied > 0
      ? parseFloat(((totalLoss / totalSupplied) * 100).toFixed(1))
      : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Feeder Monitoring</h1>
          <p className="text-muted-foreground">
            Distribution loss = Energy Supplied − Energy Billed
          </p>
        </div>
      </div>

      {/* System-wide loss alert */}
      {critical.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              {critical.length} feeder(s) have CRITICAL losses (&gt;15%):{" "}
              {critical.map((f) => f.feederName).join(", ")}. Investigate
              for theft or metering errors.
            </p>
          </CardContent>
        </Card>
      )}

      {warning.length > 0 && !critical.length && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              {warning.length} feeder(s) have WARNING losses (10–15%):{" "}
              {warning.map((f) => f.feederName).join(", ")}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* System summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Supplied",
            value: `${totalSupplied.toLocaleString("en-IN")} kWh`,
            color: "text-blue-600",
          },
          {
            label: "Total Billed",
            value: `${totalBilled.toLocaleString("en-IN")} kWh`,
            color: "text-green-600",
          },
          {
            label: "Total Loss",
            value: `${totalLoss.toLocaleString("en-IN")} kWh`,
            color: "text-red-600",
          },
          {
            label: "System Loss %",
            value: `${systemLossPercent}%`,
            color:
              systemLossPercent >= 15
                ? "text-red-600"
                : systemLossPercent >= 10
                ? "text-yellow-600"
                : "text-green-600",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feeders table */}
      <Card>
        <CardHeader>
          <CardTitle>Feeder Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feeder</TableHead>
                <TableHead>Capacity (kW)</TableHead>
                <TableHead>Transformers</TableHead>
                <TableHead>Consumers</TableHead>
                <TableHead>Supplied (kWh)</TableHead>
                <TableHead>Billed (kWh)</TableHead>
                <TableHead>Loss (kWh)</TableHead>
                <TableHead>Loss %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No feeders configured yet.
                  </TableCell>
                </TableRow>
              )}
              {feeders.map((f) => {
                const config = getLossStatusConfig(f.status);
                return (
                  <TableRow key={f.feederId}>
                    <TableCell className="font-medium">
                      {f.feederName}
                    </TableCell>
                    <TableCell>{f.capacityKW} kW</TableCell>
                    <TableCell>{f.transformerCount}</TableCell>
                    <TableCell>{f.consumerCount}</TableCell>
                    <TableCell>
                      {f.energySuppliedKWh > 0
                        ? `${f.energySuppliedKWh.toLocaleString("en-IN")} kWh`
                        : <span className="text-muted-foreground text-sm">No reading</span>
                      }
                    </TableCell>
                    <TableCell>
                      {f.energyBilledKWh.toLocaleString("en-IN")} kWh
                    </TableCell>
                    <TableCell>
                      <span className={config.color}>
                        {f.distributionLossKWh.toLocaleString("en-IN")} kWh
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${config.color}`}>
                        {f.lossPercent}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/feeders/${f.feederId}`}>
                            Detail
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link
                            href={`/admin/feeders/${f.feederId}/readings/new`}
                          >
                            Add Reading
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
    </div>
  );
}
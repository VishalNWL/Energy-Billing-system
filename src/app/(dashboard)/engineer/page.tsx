import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Zap, Users, GitBranch, Activity,
  AlertTriangle, Plus,
} from "lucide-react";
import Link from "next/link";
import { calculatePowerFactor, getPFStatusConfig } from "@/lib/electrical/power-factor";
import { calculateTransformerLoading } from "@/lib/electrical/transformer-loading";

export default async function EngineerDashboard() {
  await requireRole(["ENGINEER", "ADMIN"]);

  const [
    consumerCount,
    recentReadings,
    transformers,
    latestPFReadings,
    pendingBillsCount,
  ] = await Promise.all([
    prisma.consumer.count(),

    // Last 10 meter readings
    prisma.meterReading.findMany({
      orderBy: { readingDate: "desc" },
      take: 10,
      include: {
        meter: {
          include: {
            consumer: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    }),

    // All transformers for loading check
    prisma.transformer.findMany({
      include: {
        feeder: { select: { id: true, feederName: true } },
        consumers: { select: { sanctionedLoad: true } },
      },
    }),

    // Latest PF reading per consumer
    prisma.powerFactorReading.findMany({
      orderBy: { readingDate: "desc" },
      distinct: ["consumerId"],
      take: 10,
      include: {
        consumer: {
          include: { user: { select: { name: true } } },
        },
      },
    }),

    prisma.bill.count({ where: { status: "PENDING" } }),
  ]);

  // Compute transformer loading
  const loadingResults = transformers.map((t) =>
    calculateTransformerLoading(t)
  );
  const overloadedCount = loadingResults.filter(
    (t) => t.status === "OVERLOADED"
  ).length;
  const highLoadCount = loadingResults.filter(
    (t) => t.status === "HIGH_LOAD"
  ).length;

  // PF alerts
  const poorPFReadings = latestPFReadings.filter(
    (r) => r.powerFactor < 0.9
  );

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Engineer Dashboard</h1>
        <p className="text-muted-foreground">
          Field operations, readings, and network health overview.
        </p>
      </div>

      {/* Alerts */}
      {(overloadedCount > 0 || poorPFReadings.length > 0) && (
        <div className="space-y-2">
          {overloadedCount > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  {overloadedCount} transformer(s) OVERLOADED — immediate
                  field inspection required.
                </p>
                <Button asChild size="sm" variant="destructive" className="ml-auto shrink-0">
                  <Link href="/admin/transformers">View</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {poorPFReadings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  {poorPFReadings.length} consumer(s) have poor power factor
                  (PF &lt; 0.9) — penalty charges applying.
                </p>
                <Button asChild size="sm" variant="outline" className="ml-auto shrink-0">
                  <Link href="/admin/power-factor">View</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Consumers",
            value: consumerCount,
            icon: Users,
            color: "text-blue-600",
            href: "/admin/consumers",
          },
          {
            label: "Transformers",
            value: `${loadingResults.length} (${overloadedCount} overloaded)`,
            icon: Zap,
            color: overloadedCount > 0 ? "text-red-600" : "text-green-600",
            href: "/admin/transformers",
          },
          {
            label: "Feeders",
            value: loadingResults.reduce(
              (acc, t) =>
                acc.includes(t.feederName) ? acc : [...acc, t.feederName],
              [] as string[]
            ).length,
            icon: GitBranch,
            color: "text-blue-600",
            href: "/admin/feeders",
          },
          {
            label: "Pending Bills",
            value: pendingBillsCount,
            icon: Activity,
            color: pendingBillsCount > 0 ? "text-yellow-600" : "text-green-600",
            href: "/admin/billing",
          },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {[
            { label: "Add Meter Reading", href: "/admin/meter-readings" },
            { label: "Record PF Reading", href: "/admin/power-factor" },
            { label: "Record Demand Reading", href: "/admin/maximum-demand" },
            { label: "Add Feeder Reading", href: "/admin/feeders" },
            { label: "Generate Bills", href: "/admin/billing" },
            { label: "View Load Analysis", href: "/admin/load-analysis" },
          ].map(({ label, href }) => (
            <Button key={href} asChild size="sm" variant="outline">
              <Link href={href}>
                <Plus className="w-3 h-3 mr-1" />
                {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent meter readings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Meter Readings</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/meter-readings">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consumer</TableHead>
                  <TableHead>Reading</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReadings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      No readings yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentReadings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {r.meter.consumer.user.name}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {r.meter.consumer.consumerNumber}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {r.reading} kWh
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.readingDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transformer loading summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transformer Status</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/transformers">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transformer</TableHead>
                  <TableHead>Loading</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingResults.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      No transformers configured.
                    </TableCell>
                  </TableRow>
                )}
                {loadingResults.map((t) => (
                  <TableRow key={t.transformerId}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {t.transformerName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.feederName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(t.loadingPercent, 100)}%`,
                              backgroundColor:
                                t.status === "OVERLOADED"
                                  ? "#dc2626"
                                  : t.status === "HIGH_LOAD"
                                  ? "#ca8a04"
                                  : "#2563eb",
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold">
                          {t.loadingPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === "OVERLOADED"
                            ? "destructive"
                            : t.status === "HIGH_LOAD"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {t.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Power factor alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Power Factor Status
              </CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/power-factor">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consumer</TableHead>
                  <TableHead>kW</TableHead>
                  <TableHead>kVAR</TableHead>
                  <TableHead>Power Factor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestPFReadings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      No PF readings recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {latestPFReadings.map((r) => {
                  const calc = calculatePowerFactor(
                    r.activePowerKW,
                    r.reactivePowerKVAR
                  );
                  const config = getPFStatusConfig(calc.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {r.consumer.user.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {r.consumer.consumerNumber}
                        </div>
                      </TableCell>
                      <TableCell>{r.activePowerKW}</TableCell>
                      <TableCell>{r.reactivePowerKVAR}</TableCell>
                      <TableCell className="font-bold">
                        {calc.powerFactor.toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.badge}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {calc.penaltyPercent > 0 ? (
                          <span className="text-red-600 font-medium text-sm">
                            {calc.penaltyPercent}%
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/admin/power-factor/${r.consumerId}/new`}
                          >
                            Add Reading
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
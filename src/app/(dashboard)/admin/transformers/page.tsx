import { requireRole } from "@/lib/auth";
import { getAllTransformersWithLoading } from "@/lib/actions/transformer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransformerLoadingChart } from "@/components/admin/transformers/loading-chart";
import { getLoadingStatusConfig } from "@/lib/electrical/transformer-loading";
import Link from "next/link";
import { Zap, AlertTriangle } from "lucide-react";

export default async function TransformersPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const transformers = await getAllTransformersWithLoading();

  const overloaded = transformers.filter((t) => t.status === "OVERLOADED");
  const highLoad = transformers.filter((t) => t.status === "HIGH_LOAD");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-8 h-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Transformer Monitoring</h1>
          <p className="text-muted-foreground">
            Loading %, capacity utilization, and overload alerts.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {overloaded.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              {overloaded.length} transformer(s) OVERLOADED:{" "}
              {overloaded.map((t) => t.transformerName).join(", ")}. Immediate
              load relief or augmentation required.
            </p>
          </CardContent>
        </Card>
      )}

      {highLoad.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
              {highLoad.length} transformer(s) at HIGH LOAD (80–100%):{" "}
              {highLoad.map((t) => t.transformerName).join(", ")}. Plan
              augmentation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Transformers", value: transformers.length },
          {
            label: "Overloaded",
            value: overloaded.length,
            color: "text-red-600",
          },
          {
            label: "High Load",
            value: highLoad.length,
            color: "text-yellow-600",
          },
          {
            label: "Normal / Under",
            value: transformers.filter(
              (t) =>
                t.status === "NORMAL" || t.status === "UNDER_UTILIZED"
            ).length,
            color: "text-green-600",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color ?? ""}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading chart */}
      <TransformerLoadingChart data={transformers} />

      {/* Transformers table */}
      <Card>
        <CardHeader>
          <CardTitle>Transformer Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transformer</TableHead>
                <TableHead>Feeder</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity (kVA)</TableHead>
                <TableHead>Connected Load (kVA)</TableHead>
                <TableHead>Loading %</TableHead>
                <TableHead>Consumers</TableHead>
                <TableHead>Available (kVA)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transformers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No transformers found. Add them via Prisma Studio or seed
                    data.
                  </TableCell>
                </TableRow>
              )}
              {transformers.map((t) => {
                const config = getLoadingStatusConfig(t.status);
                return (
                  <TableRow key={t.transformerId}>
                    <TableCell className="font-medium">
                      {t.transformerName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.feederName}
                    </TableCell>
                    <TableCell>{t.location}</TableCell>
                    <TableCell>{t.capacityKVA} kVA</TableCell>
                    <TableCell>{t.totalConnectedLoadKVA} kVA</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(t.loadingPercent, 100)}%`,
                              backgroundColor: config.barColor,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-bold ${config.color}`}
                        >
                          {t.loadingPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{t.consumerCount}</TableCell>
                    <TableCell>
                      <span
                        className={
                          t.availableCapacityKVA <= 0
                            ? "text-red-600 font-medium"
                            : "text-green-600"
                        }
                      >
                        {t.availableCapacityKVA} kVA
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/transformers/${t.transformerId}`}>
                          Detail
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
  );
}
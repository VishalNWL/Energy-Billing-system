import { requireRole } from "@/lib/auth";
import {
  getAllConsumersDemandSummary,
  getConsumersForDemand,
} from "@/lib/actions/maximum-demand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default async function MaximumDemandPage() {
  await requireRole(["ADMIN", "ENGINEER"]);

  const [summaries, allConsumers] = await Promise.all([
    getAllConsumersDemandSummary(),
    getConsumersForDemand(),
  ]);

  const exceedingCount = summaries.filter((s) => s.isExceeding).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Maximum Demand Monitoring</h1>
          <p className="text-muted-foreground">
            Track peak demand, load factor, and demand charges across consumers.
          </p>
        </div>
      </div>

      {exceedingCount > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              {exceedingCount} consumer(s) are exceeding their contracted
              demand. Excess demand penalties are being applied.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Demand Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contracted (kW)</TableHead>
                <TableHead>Max Demand (kW)</TableHead>
                <TableHead>Load Factor</TableHead>
                <TableHead>Demand Charge (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No demand readings recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {summaries.map((s) => (
                <TableRow key={s.consumerId}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {s.consumerNumber}
                    </div>
                  </TableCell>
                  <TableCell>{s.consumerType}</TableCell>
                  <TableCell>
                    {s.contractedDemand ? `${s.contractedDemand} kW` : "—"}
                  </TableCell>
                  <TableCell className="font-bold">{s.maxDemandKW} kW</TableCell>
                  <TableCell>
                    <span
                      className={
                        s.loadFactor >= 0.8
                          ? "text-green-600 font-medium"
                          : s.loadFactor >= 0.6
                          ? "text-yellow-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {s.loadFactor}
                    </span>
                  </TableCell>
                  <TableCell>₹{s.demandCharge.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    {s.isExceeding ? (
                      <Badge variant="destructive">Exceeding</Badge>
                    ) : (
                      <Badge variant="default">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/maximum-demand/${s.consumerId}`}>
                          History
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/admin/maximum-demand/${s.consumerId}/new`}>
                          Add
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick add links for consumers without readings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Reading for Consumer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allConsumers.map((c) => (
              <Button key={c.id} asChild size="sm" variant="outline">
                <Link href={`/admin/maximum-demand/${c.id}/new`}>
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
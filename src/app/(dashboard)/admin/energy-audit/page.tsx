import { requireRole } from "@/lib/auth";
import { getEnergyAuditOverview } from "@/lib/actions/energy-audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, Sun } from "lucide-react";

const GRADE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  A: "default",
  B: "default",
  C: "secondary",
  D: "secondary",
  F: "destructive",
};

const GRADE_COLOR: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-yellow-600",
  D: "text-orange-600",
  F: "text-red-600",
};

export default async function EnergyAuditOverviewPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const audits = await getEnergyAuditOverview();

  const gradeDistribution = audits.reduce(
    (acc, a) => {
      acc[a.score.grade] = (acc[a.score.grade] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgScore =
    audits.length > 0
      ? Math.round(
          audits.reduce((s, a) => s + a.score.total, 0) / audits.length
        )
      : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Energy Audit Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide energy efficiency analysis and recommendations.
          </p>
        </div>
      </div>

      {/* System summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Consumers Audited</p>
            <p className="text-2xl font-bold">{audits.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Avg Audit Score</p>
            <p className="text-2xl font-bold">{avgScore}/100</p>
          </CardContent>
        </Card>
        {(["A", "B", "C"] as const).map((grade) => (
          <Card key={grade}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                Grade {grade} Consumers
              </p>
              <p className={`text-2xl font-bold ${GRADE_COLOR[grade]}`}>
                {gradeDistribution[grade] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Consumers audit table */}
      <Card>
        <CardHeader>
          <CardTitle>Consumer Energy Audit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Avg Monthly (kWh)</TableHead>
                <TableHead>Peak Demand (kW)</TableHead>
                <TableHead>Load Factor</TableHead>
                <TableHead>Avg PF</TableHead>
                <TableHead>Solar</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No consumers with billing data yet.
                  </TableCell>
                </TableRow>
              )}
              {audits.map((a) => (
                <TableRow key={a.consumerId}>
                  <TableCell>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {a.consumerNumber}
                    </div>
                  </TableCell>
                  <TableCell>{a.consumerType}</TableCell>
                  <TableCell>{a.avgMonthlyUnits} kWh</TableCell>
                  <TableCell>
                    {a.maxDemand > 0 ? `${a.maxDemand} kW` : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        a.loadFactor >= 0.8
                          ? "text-green-600 font-medium"
                          : a.loadFactor >= 0.6
                          ? "text-yellow-600 font-medium"
                          : a.loadFactor > 0
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {a.loadFactor > 0 ? a.loadFactor : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        a.avgPF >= 0.9
                          ? "text-green-600"
                          : "text-red-600 font-medium"
                      }
                    >
                      {a.avgPF}
                    </span>
                  </TableCell>
                  <TableCell>
                    {a.hasSolar ? (
                      <Sun className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${a.score.total}%`,
                            backgroundColor:
                              GRADE_COLOR[a.score.grade].replace(
                                "text-",
                                ""
                              ) === "green-600"
                                ? "#16a34a"
                                : "#2563eb",
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold">
                        {a.score.total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={GRADE_VARIANT[a.score.grade]}
                      className={GRADE_COLOR[a.score.grade]}
                    >
                      {a.score.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/admin/energy-audit/${a.consumerId}`}
                      >
                        Full Audit
                      </Link>
                    </Button>
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
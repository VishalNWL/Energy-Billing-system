import { requireRole } from "@/lib/auth";
import { getAllRecentReadings } from "@/lib/actions/meter-reading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MeterReadingsPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const readings = await getAllRecentReadings();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meter Readings</h1>
        <p className="text-muted-foreground">
          Last 50 readings across all consumers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer</TableHead>
                <TableHead>Meter #</TableHead>
                <TableHead>Reading (kWh)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Peak</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Off-Peak</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No readings recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {readings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">
                      {r.meter.consumer.user.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {r.meter.consumer.consumerNumber}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{r.meter.meterNumber}</TableCell>
                  <TableCell className="font-bold">{r.reading}</TableCell>
                  <TableCell>
                    {new Date(r.readingDate).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>{r.peakUnits ?? "—"}</TableCell>
                  <TableCell>{r.dayUnits ?? "—"}</TableCell>
                  <TableCell>{r.offPeakUnits ?? "—"}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/meter-readings/${r.meter.consumer.id}`}>
                        History
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
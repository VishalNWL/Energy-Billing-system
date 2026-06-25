import { requireRole } from "@/lib/auth";
import { getReadingsForConsumer } from "@/lib/actions/meter-reading";
import { notFound } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { DeleteReadingButton } from "@/components/admin/delete-reading-button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ConsumerReadingHistoryPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;
  const data = await getReadingsForConsumer(consumerId);

  if (!data) notFound();

  const { readings, consumer, meter } = data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meter Reading History</h1>
          <p className="text-muted-foreground">
            {consumer.user.name} —{" "}
            <span className="font-mono">{meter.meterNumber}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/meter-readings/${consumerId}/new`}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reading
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/meter-readings">← All Readings</Link>
          </Button>
        </div>
      </div>

      {/* Meter info card */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Consumer #</p>
              <p className="font-mono font-medium">{consumer.consumerNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Meter #</p>
              <p className="font-mono font-medium">{meter.meterNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={meter.isActive ? "default" : "secondary"}>
                {meter.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Total Readings</p>
              <p className="font-bold">{readings.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reading (kWh)</TableHead>
                <TableHead>Units Consumed</TableHead>
                <TableHead>Peak (kWh)</TableHead>
                <TableHead>Day (kWh)</TableHead>
                <TableHead>Off-Peak (kWh)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No readings recorded yet. Add the first reading above.
                  </TableCell>
                </TableRow>
              )}
              {readings.map((r, index) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.readingDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {r.reading}
                  </TableCell>
                  <TableCell>
                    {r.unitsConsumed !== null ? (
                      <Badge
                        variant={
                          r.unitsConsumed > 500 ? "destructive" : "default"
                        }
                      >
                        {r.unitsConsumed} kWh
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        First reading
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{r.peakUnits ?? "—"}</TableCell>
                  <TableCell>{r.dayUnits ?? "—"}</TableCell>
                  <TableCell>{r.offPeakUnits ?? "—"}</TableCell>
                  <TableCell>
                    {/* Only allow deleting the latest reading to maintain data integrity */}
                    {index === 0 ? (
                      <DeleteReadingButton
                        readingId={r.id}
                        consumerId={consumerId}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Locked
                      </span>
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
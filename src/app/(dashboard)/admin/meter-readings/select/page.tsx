import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";

const TYPE_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  RESIDENTIAL: "default",
  COMMERCIAL: "secondary",
  INDUSTRIAL: "destructive",
};

export default async function SelectConsumerForReadingPage() {
  await requireRole(["ADMIN", "ENGINEER"]);

  const consumers = await prisma.consumer.findMany({
    include: {
      user: { select: { name: true } },
      meter: {
        include: {
          readings: {
            orderBy: { readingDate: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { consumerNumber: "asc" },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Meter Reading</h1>
        <p className="text-muted-foreground">
          Select a consumer to record a new meter reading.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Consumer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {consumers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No consumers registered yet.
            </p>
          )}
          {consumers.map((c) => {
            const lastReading = c.meter?.readings[0];
            return (
              <div
                key={c.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">
                        {c.consumerNumber}
                      </span>
                      <Badge variant={TYPE_COLORS[c.consumerType]}>
                        {c.consumerType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {lastReading ? (
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Last: {lastReading.reading} kWh</p>
                      <p>
                        {new Date(lastReading.readingDate).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No readings yet
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/admin/meter-readings/${c.id}/new`}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Reading
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/meter-readings/${c.id}`}>
                        History
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
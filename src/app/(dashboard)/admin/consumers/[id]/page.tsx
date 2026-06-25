import { requireRole } from "@/lib/auth";
import { getConsumerById } from "@/lib/actions/consumer";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Zap, MapPin, Hash, Gauge } from "lucide-react";

const BILL_STATUS_COLOR: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
};

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export default async function ViewConsumerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { id } = await params;
  const consumer = await getConsumerById(id);

  if (!consumer) notFound();

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{consumer.user.name}</h1>
          <p className="text-muted-foreground">{consumer.consumerNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/consumers/${id}/edit`}>Edit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/consumers">← Back</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4" /> Consumer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{consumer.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge>{consumer.consumerType}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meter #</span>
              <span className="font-mono">{consumer.meter?.meterNumber ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" /> Electrical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sanctioned Load</span>
              <span>{consumer.sanctionedLoad} kW</span>
            </div>
            {consumer.contractedDemand && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contracted Demand</span>
                <span>{consumer.contractedDemand} kVA</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transformer</span>
              <span>{consumer.transformer?.transformerName ?? "Unassigned"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Feeder</span>
              <span>{consumer.transformer?.feeder.feederName ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{consumer.address}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Solar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {consumer.solarPlant ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span>{consumer.solarPlant.installedCapacityKW} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated</span>
                  <span>{consumer.solarPlant.generatedUnits} kWh</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No solar plant registered.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {consumer.bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills generated yet.</p>
          ) : (
            <div className="space-y-2">
              {consumer.bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between border rounded-md px-4 py-2 text-sm"
                >
                  <span>{MONTH_NAMES[bill.billingMonth - 1]} {bill.billingYear}</span>
                  <span>{bill.unitsConsumed} kWh</span>
                  <span className="font-medium">₹{bill.totalAmount.toLocaleString("en-IN")}</span>
                  <Badge variant={BILL_STATUS_COLOR[bill.status]}>{bill.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
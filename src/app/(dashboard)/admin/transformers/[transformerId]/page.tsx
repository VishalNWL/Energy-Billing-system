import { requireRole } from "@/lib/auth";
import { getTransformerDetail } from "@/lib/actions/transformer";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingGauge } from "@/components/admin/transformers/loading-gauge";
import {
  getLoadingStatusConfig,
} from "@/lib/electrical/transformer-loading";
import Link from "next/link";
import { MapPin, Zap, Users } from "lucide-react";

const TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  RESIDENTIAL: "default",
  COMMERCIAL: "secondary",
  INDUSTRIAL: "destructive",
};

export default async function TransformerDetailPage({
  params,
}: {
  params: Promise<{ transformerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { transformerId } = await params;

  const data = await getTransformerDetail(transformerId);
  if (!data) notFound();

  const { transformer, loading } = data;
  const config = getLoadingStatusConfig(loading.status);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {transformer.transformerName}
          </h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {transformer.location} — Feeder:{" "}
            {transformer.feeder.feederName}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={config.badge} className="text-sm px-3 py-1">
            {config.label}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/transformers">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Overload alert */}
      {loading.status === "OVERLOADED" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 text-sm text-red-700 dark:text-red-300 font-medium">
            ⚠ This transformer is OVERLOADED at {loading.loadingPercent}%
            of its {loading.capacityKVA} kVA capacity. Immediate action
            required: transfer load to adjacent transformer or augment
            capacity.
          </CardContent>
        </Card>
      )}

      {loading.status === "HIGH_LOAD" && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 text-sm text-yellow-700 dark:text-yellow-300">
            ⚠ Loading at {loading.loadingPercent}%. Plan capacity
            augmentation before adding new connections.
          </CardContent>
        </Card>
      )}

      {/* Loading gauge + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`border ${config.border} ${config.bg}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" /> Loading Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <LoadingGauge
              loadingPercent={loading.loadingPercent}
              status={loading.status}
              capacityKVA={loading.capacityKVA}
            />
            <div className="grid grid-cols-2 gap-3 text-sm flex-1">
              {[
                {
                  label: "Capacity",
                  value: `${loading.capacityKVA} kVA`,
                },
                {
                  label: "Connected Load",
                  value: `${loading.totalConnectedLoadKVA} kVA`,
                },
                {
                  label: "Connected (kW)",
                  value: `${loading.totalConnectedLoadKW} kW`,
                },
                {
                  label: "Available",
                  value: `${loading.availableCapacityKVA} kVA`,
                },
                {
                  label: "Can Add",
                  value: `${loading.canAddLoadKW} kW`,
                },
                {
                  label: "Consumers",
                  value: loading.consumerCount,
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transformer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "Name", value: transformer.transformerName },
              { label: "Capacity", value: `${transformer.capacityKVA} kVA` },
              { label: "Location", value: transformer.location },
              { label: "Feeder", value: transformer.feeder.feederName },
              {
                label: "Feeder Capacity",
                value: `${transformer.feeder.capacityKW} kW`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between border-b pb-1"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Connected consumers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Connected Consumers ({transformer.consumers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Meter #</TableHead>
                <TableHead>Sanctioned Load</TableHead>
                <TableHead>Last Bill</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transformer.consumers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No consumers connected to this transformer.
                  </TableCell>
                </TableRow>
              )}
              {transformer.consumers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">
                    {c.consumerNumber}
                  </TableCell>
                  <TableCell>
                    <div>{c.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[c.consumerType]}>
                      {c.consumerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {c.meter?.meterNumber ?? "—"}
                  </TableCell>
                  <TableCell>{c.sanctionedLoad} kW</TableCell>
                  <TableCell>
                    {c.bills[0] ? (
                      <div>
                        <p className="font-medium">
                          ₹{c.bills[0].totalAmount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.bills[0].unitsConsumed} kWh
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No bills
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/consumers/${c.id}`}>View</Link>
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
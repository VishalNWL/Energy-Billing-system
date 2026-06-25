import Link from "next/link";
import { getConsumers } from "@/lib/actions/consumer";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DeleteConsumerButton } from "@/components/admin/delete-consumer-button";

const TYPE_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  RESIDENTIAL: "default",
  COMMERCIAL: "secondary",
  INDUSTRIAL: "destructive",
};

export default async function ConsumersPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const consumers = await getConsumers();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consumers</h1>
          <p className="text-muted-foreground">
            {consumers.length} total registered consumers
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/consumers/new">
            <Plus className="w-4 h-4 mr-2" /> Add Consumer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumer Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Meter #</TableHead>
                <TableHead>Transformer</TableHead>
                <TableHead>Sanctioned Load</TableHead>
                <TableHead>Bills</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No consumers registered yet.
                  </TableCell>
                </TableRow>
              )}
              {consumers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">
                    {c.consumerNumber}
                  </TableCell>
                  <TableCell>
                    <div>{c.user.name}</div>
                    <div className="text-xs text-muted-foreground">{c.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TYPE_COLORS[c.consumerType]}>
                      {c.consumerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {c.meter?.meterNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    {c.transformer ? (
                      <div>
                        <div className="text-sm">{c.transformer.transformerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.transformer.feeder.feederName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{c.sanctionedLoad} kW</TableCell>
                  <TableCell>{c._count.bills}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/consumers/${c.id}`}>View</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/consumers/${c.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteConsumerButton consumerId={c.id} />
                    </div>
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
import { requireRole } from "@/lib/auth";
import { getAllSolarPlants } from "@/lib/actions/solar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sun, Plus } from "lucide-react";

export default async function SolarPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const plants = await getAllSolarPlants();

  const totalCapacity = plants.reduce(
    (sum, p) => sum + p.plant.installedCapacityKW,
    0
  );
  const totalGenerated = plants.reduce(
    (sum, p) => sum + p.plant.generatedUnits,
    0
  );
  const totalSavings = plants.reduce(
    (sum, p) => sum + (p.netMetering?.solarAdjustment ?? 0),
    0
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">
              Rooftop Solar Net Metering
            </h1>
            <p className="text-muted-foreground">
              Manage solar plants and net metering adjustments.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/solar/register">
            <Plus className="w-4 h-4 mr-2" /> Register Solar Plant
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Solar Plants",
            value: plants.length,
            color: "text-yellow-600",
          },
          {
            label: "Total Installed Capacity",
            value: `${totalCapacity.toFixed(1)} kW`,
            color: "text-blue-600",
          },
          {
            label: "Total Generated",
            value: `${totalGenerated.toLocaleString("en-IN")} kWh`,
            color: "text-green-600",
          },
          {
            label: "Total Consumer Savings",
            value: `₹${totalSavings.toLocaleString("en-IN")}`,
            color: "text-green-600",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Solar plants table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Solar Plants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity (kW)</TableHead>
                <TableHead>Generated (kWh)</TableHead>
                <TableHead>Est. Monthly Gen.</TableHead>
                <TableHead>Last Bill Savings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No solar plants registered yet.
                  </TableCell>
                </TableRow>
              )}
              {plants.map(({ plant, consumer, netMetering, estimatedMonthlyGeneration }) => (
                <TableRow key={plant.id}>
                  <TableCell>
                    <div className="font-medium">{consumer.user.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {consumer.consumerNumber}
                    </div>
                  </TableCell>
                  <TableCell>{consumer.consumerType}</TableCell>
                  <TableCell className="font-bold">
                    {plant.installedCapacityKW} kW
                  </TableCell>
                  <TableCell>
                    {plant.generatedUnits.toLocaleString("en-IN")} kWh
                  </TableCell>
                  <TableCell className="text-yellow-600 font-medium">
                    ~{estimatedMonthlyGeneration} kWh
                  </TableCell>
                  <TableCell>
                    {netMetering ? (
                      <span className="text-green-600 font-medium">
                        ₹{netMetering.solarAdjustment.toLocaleString("en-IN")}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({netMetering.savingsPercent}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No bill yet
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={plant.isActive ? "default" : "secondary"}
                    >
                      {plant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/admin/solar/${consumer.id}`}
                        >
                          Dashboard
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/admin/solar/${consumer.id}/update`}
                        >
                          Update
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
    </div>
  );
}
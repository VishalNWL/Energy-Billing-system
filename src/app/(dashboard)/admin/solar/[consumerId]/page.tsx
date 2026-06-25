import { requireRole } from "@/lib/auth";
import { getSolarPlantDetail } from "@/lib/actions/solar";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolarSavingsChart } from "@/components/admin/solar/solar-savings-chart";
import Link from "next/link";
import { Sun, TrendingDown } from "lucide-react";

export default async function SolarConsumerDashboardPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const data = await getSolarPlantDetail(consumerId);
  if (!data) notFound();

  const {
    plant,
    consumer,
    monthlyHistory,
    totalSavings,
    estimatedMonthlyGeneration,
    payback,
  } = data;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Solar Dashboard</h1>
            <p className="text-muted-foreground">
              {consumer.user.name} — {consumer.consumerNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/solar/${consumerId}/update`}>
              Update Generation
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/solar">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Plant info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Installed Capacity",
            value: `${plant.installedCapacityKW} kW`,
            color: "text-yellow-600",
          },
          {
            label: "Total Generated",
            value: `${plant.generatedUnits.toLocaleString("en-IN")} kWh`,
            color: "text-green-600",
          },
          {
            label: "Est. Monthly Output",
            value: `${estimatedMonthlyGeneration} kWh`,
            color: "text-blue-600",
          },
          {
            label: "Total Savings",
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

      {/* Payback period */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-yellow-600" />
            <div className="text-sm">
              <span className="font-medium text-yellow-800 dark:text-yellow-300">
                Estimated Payback Period:{" "}
              </span>
              <span className="font-bold text-yellow-800 dark:text-yellow-300">
                {payback.years > 0 ? `${payback.years} years ` : ""}
                {payback.months} months
              </span>
              <span className="text-muted-foreground ml-2">
                (assuming ₹60,000/kW installation cost)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net metering table */}
      {monthlyHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Net Metering Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {[
                      "Month",
                      "Consumed",
                      "Generated",
                      "Net Units",
                      "Gross Bill",
                      "Net Bill",
                      "Savings",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 text-muted-foreground font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyHistory.map((m) => (
                    <tr key={m.month}>
                      <td className="py-2 pr-4 font-medium">{m.month}</td>
                      <td className="py-2 pr-4">{m.consumedUnits.toFixed(1)} kWh</td>
                      <td className="py-2 pr-4 text-yellow-600">
                        {m.generatedUnits.toFixed(1)} kWh
                      </td>
                      <td className="py-2 pr-4 text-green-600 font-medium">
                        {m.netUnits.toFixed(1)} kWh
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        ₹{m.grossBill.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 pr-4 font-medium">
                        ₹{m.netBill.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 text-green-600 font-bold">
                        ₹{m.savings.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings chart */}
      <SolarSavingsChart data={monthlyHistory} />
    </div>
  );
}
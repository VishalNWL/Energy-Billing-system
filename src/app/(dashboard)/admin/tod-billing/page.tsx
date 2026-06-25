import { requireRole } from "@/lib/auth";
import { getConsumersWithTodAction } from "@/lib/actions/tod-billing";
import { TodBillForm } from "@/components/admin/tod/tod-bill-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default async function TodBillingPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const consumers = await getConsumersWithTodAction();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Time of Day Tariff Billing</h1>
          <p className="text-muted-foreground">
            Calculate bills based on when electricity is consumed — peak hours
            cost more to encourage off-peak usage.
          </p>
        </div>
      </div>

      {/* Why ToD matters */}
      <Card className="bg-muted/40">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Why Time of Day tariffs?</strong> DISCOMs charge more
            during peak hours (6PM–10PM) to reduce grid stress and incentivize
            consumers to shift loads to off-peak hours. Consumers with smart
            meters that record slot-wise consumption are billed under this
            tariff instead of flat-rate billing.
          </p>
        </CardContent>
      </Card>

      <TodBillForm consumers={consumers} />

      {/* ToD vs Flat rate explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            ToD vs Flat Rate Billing Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Scenario
                  </th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">
                    Units
                  </th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">
                    Flat Rate (avg ₹6)
                  </th>
                  <th className="text-right py-2 font-medium text-muted-foreground">
                    ToD Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  {
                    scenario: "Heavy peak usage",
                    units: 300,
                    flat: 1800,
                    tod: 2700,
                    note: "300 peak @ ₹9",
                  },
                  {
                    scenario: "Mostly day usage",
                    units: 300,
                    flat: 1800,
                    tod: 1800,
                    note: "300 day @ ₹6",
                  },
                  {
                    scenario: "Off-peak shift",
                    units: 300,
                    flat: 1800,
                    tod: 1500,
                    note: "300 off-peak @ ₹5",
                  },
                  {
                    scenario: "Mixed (100+100+100)",
                    units: 300,
                    flat: 1800,
                    tod: 2000,
                    note: "₹600+₹900+₹500",
                  },
                ].map(({ scenario, units, flat, tod, note }) => (
                  <tr key={scenario}>
                    <td className="py-2 pr-4">{scenario}</td>
                    <td className="text-right py-2 pr-4">{units} kWh</td>
                    <td className="text-right py-2 pr-4">₹{flat}</td>
                    <td className="text-right py-2">
                      <span
                        className={
                          tod > flat
                            ? "text-red-600 font-medium"
                            : tod < flat
                            ? "text-green-600 font-medium"
                            : "font-medium"
                        }
                      >
                        ₹{tod}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({note})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
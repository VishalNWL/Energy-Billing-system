import { requireRole } from "@/lib/auth";
import { getAllConsumersForLoadAnalysis } from "@/lib/queries/load-analysis";
import { Card, CardContent } from "@/components/ui/card";
import { ConsumerSelector } from "@/components/admin/load-analysis/consumer-selector";
import { Activity } from "lucide-react";

export default async function LoadAnalysisPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const consumers = await getAllConsumersForLoadAnalysis();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Load Consumption Analysis</h1>
        <p className="text-muted-foreground">
          Visualize daily, weekly, and monthly load curves and detect peak demand periods.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ConsumerSelector consumers={consumers} />
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Activity className="w-12 h-12 opacity-30" />
        <p>Select a consumer above to view their load analysis.</p>
      </div>
    </div>
  );
}
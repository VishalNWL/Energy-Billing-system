import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, AlertTriangle, Activity } from "lucide-react";
import type { PeakInfo } from "@/lib/queries/load-analysis";

interface Props {
  totalReadings: number;
  sanctionedLoad: number;
  peak: PeakInfo | null;
}

export function LoadSummaryCards({
  totalReadings,
  sanctionedLoad,
  peak,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Total Readings</span>
          </div>
          <p className="text-2xl font-bold">{totalReadings}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Sanctioned Load</span>
          </div>
          <p className="text-2xl font-bold">{sanctionedLoad} kW</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Peak Consumption</span>
          </div>
          {peak ? (
            <div>
              <p className="text-2xl font-bold">{peak.units} kWh</p>
              <p className="text-xs text-muted-foreground">on {peak.date}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
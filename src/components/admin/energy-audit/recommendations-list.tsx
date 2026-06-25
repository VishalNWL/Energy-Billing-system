import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnergyRecommendation } from "@/lib/electrical/energy-audit";
import { Lightbulb } from "lucide-react";

const PRIORITY_CONFIG = {
  HIGH: { variant: "destructive" as const, label: "High Priority" },
  MEDIUM: { variant: "secondary" as const, label: "Medium" },
  LOW: { variant: "default" as const, label: "Low" },
};

export function RecommendationsList({
  recommendations,
}: {
  recommendations: EnergyRecommendation[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Energy Saving Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Excellent! No major recommendations at this time.
          </p>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={PRIORITY_CONFIG[rec.priority].variant}
                    >
                      {PRIORITY_CONFIG[rec.priority].label}
                    </Badge>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                  <p className="font-medium text-sm mt-1">{rec.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-green-600 font-bold text-sm">
                    ~{rec.estimatedSavingsPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">savings</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rec.description}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
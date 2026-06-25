import { requireRole } from "@/lib/auth";
import { PFCorrectionForm } from "@/components/admin/pf-correction/pf-correction-form";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { calculatePowerFactor } from "@/lib/electrical/power-factor";

export default async function PFCorrectionPage() {
  await requireRole(["ADMIN", "ENGINEER"]);

  // Pre-fill with the worst PF consumer's latest reading
  const worstPFConsumer = await prisma.powerFactorReading.findFirst({
    where: { powerFactor: { lt: 0.9 } },
    orderBy: { powerFactor: "asc" },
    include: {
      consumer: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Power Factor Correction</h1>
        <p className="text-muted-foreground">
          Calculate the capacitor bank size required to improve power factor
          using Qc = P(tanφ₁ − tanφ₂).
        </p>
      </div>

      {/* Formula reference */}
      <Card className="bg-muted/40">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Formula</p>
              <p className="font-mono bg-background rounded p-2 border">
                Qc = P × (tanφ₁ − tanφ₂)
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground text-xs">
                <li>Qc = Capacitor bank size (kVAR)</li>
                <li>P = Active power (kW)</li>
                <li>φ₁ = arccos(current PF)</li>
                <li>φ₂ = arccos(target PF)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Why correct PF?</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>✓ Eliminate PF penalty charges</li>
                <li>✓ Reduce apparent power (kVA) demand</li>
                <li>✓ Lower line current → reduced losses</li>
                <li>✓ Improve voltage profile</li>
                <li>✓ Release transformer capacity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-fill notice */}
      {worstPFConsumer && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 text-sm">
            <p className="text-yellow-800 dark:text-yellow-300">
              <strong>Suggested:</strong> Pre-filled with worst PF consumer —{" "}
              {worstPFConsumer.consumer.user.name} (
              {worstPFConsumer.consumer.consumerNumber}), PF ={" "}
              {worstPFConsumer.powerFactor.toFixed(3)}
            </p>
          </CardContent>
        </Card>
      )}

      <PFCorrectionForm
        defaultKW={worstPFConsumer?.activePowerKW}
        defaultCurrentPF={worstPFConsumer?.powerFactor}
      />
    </div>
  );
}
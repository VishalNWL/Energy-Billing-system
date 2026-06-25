import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeederReadingForm } from "@/components/admin/feeders/feeder-reading-form";
import { notFound } from "next/navigation";

export default async function AddFeederReadingPage({
  params,
}: {
  params: Promise<{ feederId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { feederId } = await params;

  const feeder = await prisma.feeder.findUnique({
    where: { id: feederId },
    include: {
      transformers: {
        include: {
          consumers: {
            include: {
              bills: { select: { unitsConsumed: true } },
            },
          },
        },
      },
    },
  });

  if (!feeder) notFound();

  // Compute current total billed across all consumers under this feeder
  const currentBilledKWh = parseFloat(
    feeder.transformers
      .flatMap((t) => t.consumers)
      .flatMap((c) => c.bills)
      .reduce((sum, b) => sum + b.unitsConsumed, 0)
      .toFixed(2)
  );

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Feeder Energy Reading</h1>
        <p className="text-muted-foreground">{feeder.feederName}</p>
      </div>
      <FeederReadingForm
        feederId={feederId}
        feederName={feeder.feederName}
        currentBilledKWh={currentBilledKWh}
      />
    </div>
  );
}
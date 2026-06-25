import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateGenerationForm } from "@/components/admin/solar/update-generation-form";
import { notFound } from "next/navigation";

export default async function UpdateSolarGenerationPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const plant = await prisma.solarPlant.findUnique({
    where: { consumerId },
    include: {
      consumer: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!plant) notFound();

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Update Solar Generation</h1>
        <p className="text-muted-foreground">
          {plant.consumer.user.name} — {plant.consumer.consumerNumber}
        </p>
      </div>
      <UpdateGenerationForm
        consumerId={consumerId}
        currentGeneratedUnits={plant.generatedUnits}
        installedCapacityKW={plant.installedCapacityKW}
      />
    </div>
  );
}
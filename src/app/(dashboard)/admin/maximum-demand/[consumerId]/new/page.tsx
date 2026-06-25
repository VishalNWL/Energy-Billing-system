import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DemandReadingForm } from "@/components/admin/maximum-demand/demand-reading-form";
import { notFound } from "next/navigation";

export default async function AddDemandReadingPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: { user: { select: { name: true } } },
  });

  if (!consumer) notFound();

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Demand Reading</h1>
        <p className="text-muted-foreground">
          {consumer.user.name} — {consumer.consumerNumber}
        </p>
      </div>
      <DemandReadingForm
        consumerId={consumerId}
        contractedDemandKW={consumer.contractedDemand}
        consumerName={consumer.user.name}
        consumerNumber={consumer.consumerNumber}
      />
    </div>
  );
}
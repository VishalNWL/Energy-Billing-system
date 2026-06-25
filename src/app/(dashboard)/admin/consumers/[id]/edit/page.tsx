import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsumerForm } from "@/components/admin/consumer-form";
import { updateConsumer } from "@/lib/actions/consumer";
import { notFound } from "next/navigation";

export default async function EditConsumerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { id } = await params;

  const [consumer, transformers] = await Promise.all([
    prisma.consumer.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        meter: { select: { meterNumber: true } },
      },
    }),
    prisma.transformer.findMany({
      include: { feeder: { select: { feederName: true } } },
      orderBy: { transformerName: "asc" },
    }),
  ]);

  if (!consumer) notFound();

  const defaultValues = {
    name: consumer.user.name,
    email: consumer.user.email,
    consumerNumber: consumer.consumerNumber,
    consumerType: consumer.consumerType,
    address: consumer.address,
    sanctionedLoad: consumer.sanctionedLoad,
    contractedDemand: consumer.contractedDemand ?? undefined,
    connectedTransformerId: consumer.connectedTransformerId ?? undefined,
    meterNumber: consumer.meter?.meterNumber ?? "",
  };

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Consumer</h1>
        <p className="text-muted-foreground">
          Updating: {consumer.consumerNumber}
        </p>
      </div>
      <ConsumerForm
        mode="edit"
        defaultValues={defaultValues}
        transformers={transformers}
        onSubmit={(data) => updateConsumer(id, data)}
      />
    </div>
  );
}
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsumerForm } from "@/components/admin/consumer-form";
import { notFound } from "next/navigation";

export default async function EditConsumerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { id } = await params;

  const consumer = await prisma.consumer.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      meter: { select: { meterNumber: true } },
    },
  });

  if (!consumer) notFound();

  const defaultValues = {
    name: consumer.user.name,
    email: consumer.user.email,
    consumerNumber: consumer.consumerNumber,
    consumerType: consumer.consumerType,
    address: consumer.address,
    sanctionedLoad: consumer.sanctionedLoad,
    contractedDemand: consumer.contractedDemand ?? undefined,
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
        consumerId={id}
        defaultValues={defaultValues}
      />
    </div>
  );
}
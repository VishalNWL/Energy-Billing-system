import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PFReadingForm } from "@/components/admin/power-factor/pf-reading-form";
import { notFound } from "next/navigation";

export default async function AddPFReadingPage({
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
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add PF Reading</h1>
        <p className="text-muted-foreground">
          {consumer.user.name} — {consumer.consumerNumber}
        </p>
      </div>
      <PFReadingForm consumerId={consumerId} />
    </div>
  );
}
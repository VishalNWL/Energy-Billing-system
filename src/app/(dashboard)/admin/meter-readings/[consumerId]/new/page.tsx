import { requireRole } from "@/lib/auth";
import { getLatestReadingForConsumer } from "@/lib/actions/meter-reading";
import { prisma } from "@/lib/prisma";
import { MeterReadingForm } from "@/components/admin/meter-reading-form";
import { notFound } from "next/navigation";

export default async function AddMeterReadingPage({
  params,
}: {
  params: Promise<{ consumerId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { consumerId } = await params;

  const [consumer, latestReading] = await Promise.all([
    prisma.consumer.findUnique({
      where: { id: consumerId },
      include: {
        user: { select: { name: true } },
        meter: { select: { meterNumber: true } },
      },
    }),
    getLatestReadingForConsumer(consumerId),
  ]);

  if (!consumer || !consumer.meter) notFound();

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Meter Reading</h1>
        <p className="text-muted-foreground">
          Consumer: {consumer.user.name} —{" "}
          <span className="font-mono">{consumer.consumerNumber}</span>
        </p>
      </div>

      <MeterReadingForm
        consumerId={consumerId}
        meterNumber={consumer.meter.meterNumber}
        previousReading={latestReading?.current?.reading ?? null}
        previousDate={
          latestReading?.current?.readingDate
            ? new Date(latestReading.current.readingDate).toISOString()
            : null
        }
      />
    </div>
  );
}
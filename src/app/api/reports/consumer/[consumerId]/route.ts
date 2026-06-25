import { renderToBuffer , DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ConsumerReportPDF } from "@/lib/pdf/documents/consumer-report-pdf";
import React from "react";
import type { ReactElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ consumerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { consumerId } = await params;

  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      user: { select: { name: true, email: true } },
      meter: { select: { meterNumber: true, isActive: true } },
      transformer: {
        include: { feeder: { select: { feederName: true } } },
      },
      solarPlant: {
        select: { installedCapacityKW: true, generatedUnits: true },
      },
      bills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        select: {
          billingMonth: true,
          billingYear: true,
          unitsConsumed: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  if (!consumer) {
    return new NextResponse("Consumer not found", { status: 404 });
  }

  const totalUnits = consumer.bills.reduce(
    (s, b) => s + b.unitsConsumed,
    0
  );
  const totalBilled = consumer.bills.reduce(
    (s, b) => s + b.totalAmount,
    0
  );
  const avgMonthlyUnits =
    consumer.bills.length > 0 ? totalUnits / consumer.bills.length : 0;

 const buffer = await renderToBuffer(
  React.createElement(ConsumerReportPDF, {
    consumer,
    totalUnits,
    totalBilled,
    avgMonthlyUnits,
  }) as unknown as ReactElement<DocumentProps>
);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="consumer-${consumer.consumerNumber}.pdf"`,
    },
  });
}
import { renderToBuffer ,  } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { BillPDF } from "@/lib/pdf/documents/bill-pdf";
import React from "react";
import type { ReactElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ billId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { billId } = await params;

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      consumer: {
        include: {
          user: { select: { name: true, email: true } },
          meter: { select: { meterNumber: true } },
          transformer: {
            include: { feeder: { select: { feederName: true } } },
          },
        },
      },
    },
  });

  if (!bill) return new NextResponse("Bill not found", { status: 404 });

        const element = React.createElement(BillPDF, { bill: bill }) as any;
        const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bill-${bill.consumer.consumerNumber}-${bill.billingMonth}-${bill.billingYear}.pdf"`,
    },
  });
}
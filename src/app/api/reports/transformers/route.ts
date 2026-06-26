import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { TransformerReportPDF } from "@/lib/pdf/documents/transformer-report-pdf";
import { calculateTransformerLoading } from "@/lib/electrical/transformer-loading";
import React from "react";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const transformers = await prisma.transformer.findMany({
    include: {
      feeder: { select: { id: true, feederName: true } },
      consumers: { select: { sanctionedLoad: true } },
    },
    orderBy: { transformerName: "asc" },
  });

  const loadingData = transformers.map((t) =>
    calculateTransformerLoading(t)
  );

  const buffer = await renderToBuffer(
    React.createElement(
      TransformerReportPDF,
      { transformers: loadingData }
    ) as any
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="transformer-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
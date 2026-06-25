import { renderToBuffer ,DocumentProps} from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConsumerEnergyAudit } from "@/lib/actions/energy-audit";
import { AuditReportPDF } from "@/lib/pdf/documents/audit-report-pdf";
import React from "react";
import type { ReactElement } from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ consumerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { consumerId } = await params;
  const data = await getConsumerEnergyAudit(consumerId);

  if (!data) {
    return new NextResponse("Consumer not found", { status: 404 });
  }

const buffer = await renderToBuffer(
  React.createElement(AuditReportPDF, {
    consumerName: data.consumer.user.name,
    consumerNumber: data.consumer.consumerNumber,
    consumerType: data.consumer.consumerType,
    auditDate: new Date().toLocaleDateString("en-IN"),
    totalUnits: data.totalUnits,
    avgMonthlyUnits: data.avgMonthlyUnits,
    maxDemandKW: data.maxDemandKW,
    loadFactor: data.loadFactor,
    avgPF: data.avgPF,
    hasSolar: data.hasSolar,
    score: data.score,
    recommendations: data.recommendations,
    monthlyConsumption: data.monthlyConsumption,
  }) as unknown as ReactElement<DocumentProps>
);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="audit-${data.consumer.consumerNumber}.pdf"`,
    },
  });
}
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadButton } from "@/components/admin/reports/download-button";
import { FileText, Users, Zap, ClipboardList } from "lucide-react";

export default async function ReportsPage() {
  await requireRole(["ADMIN", "ENGINEER"]);

  const [consumers, billCount] = await Promise.all([
    prisma.consumer.findMany({
      select: {
        id: true,
        consumerNumber: true,
        user: { select: { name: true } },
        bills: { select: { id: true }, take: 1, orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }] },
      },
      orderBy: { consumerNumber: "asc" },
    }),
    prisma.bill.count(),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download PDF reports for billing, consumers, transformers, and energy audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Transformer report */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Transformer Loading Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              System-wide transformer loading analysis including capacity utilization, overload status, and connected consumers.
            </p>
            <DownloadButton
              url="/api/reports/transformers"
              filename={`transformer-report-${new Date().toISOString().slice(0, 10)}.pdf`}
              label="Download Transformer Report"
              variant="default"
            />
          </CardContent>
        </Card>

        {/* Consumer reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Consumer Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Full billing history, connection details, and consumption summary per consumer.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {consumers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-mono font-medium">
                      {c.consumerNumber}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {c.user.name}
                    </span>
                  </div>
                  <DownloadButton
                    url={`/api/reports/consumer/${c.id}`}
                    filename={`consumer-${c.consumerNumber}.pdf`}
                    label="PDF"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bill PDFs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              Monthly Bill PDFs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download individual electricity bills for any consumer. Go to billing module to access per-bill download.
            </p>
            <p className="text-xs text-muted-foreground">
              {billCount} bills in system
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {consumers.map((c) =>
                c.bills[0] ? (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-mono font-medium">
                        {c.consumerNumber}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        Latest Bill
                      </span>
                    </div>
                    <DownloadButton
                      url={`/api/reports/bill/${c.bills[0].id}`}
                      filename={`bill-${c.consumerNumber}-latest.pdf`}
                      label="PDF"
                      size="sm"
                    />
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>

        {/* Energy audit reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-500" />
              Energy Audit Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              2-page audit report with KPIs, score breakdown, and energy saving recommendations.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {consumers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-mono font-medium">
                      {c.consumerNumber}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {c.user.name}
                    </span>
                  </div>
                  <DownloadButton
                    url={`/api/reports/audit/${c.id}`}
                    filename={`audit-${c.consumerNumber}.pdf`}
                    label="PDF"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
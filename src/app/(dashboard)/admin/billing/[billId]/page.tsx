import { requireRole } from "@/lib/auth";
import { getBillById } from "@/lib/actions/billing";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BillStatusButtons } from "@/components/admin/bill-status-buttons";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { DownloadButton } from "@/components/admin/reports/download-button";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PAID: "default",
  PENDING: "secondary",
  OVERDUE: "destructive",
};

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const { billId } = await params;
  const bill = await getBillById(billId);

  if (!bill) notFound();

  const { consumer } = bill;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bill Detail</h1>
          <p className="text-muted-foreground">
            {MONTH_NAMES[bill.billingMonth - 1]} {bill.billingYear} —{" "}
            {consumer.consumerNumber}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant={STATUS_VARIANT[bill.status]} className="text-sm px-3 py-1">
            {bill.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/billing">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Consumer info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consumer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: "Name", value: consumer.user.name },
            { label: "Email", value: consumer.user.email },
            { label: "Consumer #", value: consumer.consumerNumber },
            { label: "Meter #", value: consumer.meter?.meterNumber ?? "—" },
            { label: "Type", value: consumer.consumerType },
            { label: "Transformer", value: consumer.transformer?.transformerName ?? "Unassigned" },
            { label: "Feeder", value: consumer.transformer?.feeder.feederName ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bill breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bill Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            { label: "Units Consumed", value: `${bill.unitsConsumed} kWh` },
            { label: "Energy Charge", value: `₹${bill.energyCharge.toFixed(2)}` },
            { label: "Fixed Charge", value: `₹${bill.fixedCharge.toFixed(2)}` },
            { label: "Demand Charge", value: `₹${bill.demandCharge.toFixed(2)}` },
            { label: "Power Factor Penalty", value: `₹${bill.powerFactorPenalty.toFixed(2)}` },
            { label: "Solar Adjustment (−)", value: `−₹${bill.solarAdjustment.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Tax (5%)</span>
            <span>₹{bill.taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-2 text-lg font-bold">
            <span>Total Amount</span>
            <span>₹{bill.totalAmount.toLocaleString("en-IN")}</span>
          </div>

          {bill.dueDate && (
            <p className="text-xs text-muted-foreground">
              Due by: {new Date(bill.dueDate).toLocaleDateString("en-IN")}
            </p>
          )}
          {bill.paidAt && (
            <p className="text-xs text-green-600">
              Paid on: {new Date(bill.paidAt).toLocaleDateString("en-IN")}
            </p>
          )}
        </CardContent>
      </Card>

      <BillStatusButtons billId={bill.id} currentStatus={bill.status} />
      <DownloadButton
  url={`/api/reports/bill/${billId}`}
  filename={`bill-${bill.consumer.consumerNumber}-${bill.billingMonth}-${bill.billingYear}.pdf`}
  label="Download Bill PDF"
  variant="default"
/>
    </div>
  );
}
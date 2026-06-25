import { requireRole } from "@/lib/auth";
import { getAllBills } from "@/lib/actions/billing";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerateBillForm } from "@/components/admin/generate-bill-form";
import { BillStatusButtons } from "@/components/admin/bill-status-buttons";
import Link from "next/link";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PAID: "default",
  PENDING: "secondary",
  OVERDUE: "destructive",
};

export default async function BillingPage() {
  await requireRole(["ADMIN", "ENGINEER"]);

  const [bills, consumers] = await Promise.all([
    getAllBills(),
    prisma.consumer.findMany({
      select: { id: true, consumerNumber: true, user: { select: { name: true } } },
      orderBy: { consumerNumber: "asc" },
    }),
  ]);

  const totalRevenue = bills
    .filter((b) => b.status === "PAID")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingAmount = bills
    .filter((b) => b.status === "PENDING")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const overdueAmount = bills
    .filter((b) => b.status === "OVERDUE")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing Engine</h1>
        <p className="text-muted-foreground">
          Generate, manage, and track electricity bills.
        </p>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Collected", value: totalRevenue, color: "text-green-600" },
          { label: "Pending", value: pendingAmount, color: "text-yellow-600" },
          { label: "Overdue", value: overdueAmount, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>
                ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bill generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerateBillForm consumers={consumers} />
        </CardContent>
      </Card>

      {/* Bills table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bills ({bills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consumer</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Energy ₹</TableHead>
                <TableHead>Fixed ₹</TableHead>
                <TableHead>Tax ₹</TableHead>
                <TableHead>Total ₹</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No bills generated yet.
                  </TableCell>
                </TableRow>
              )}
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div className="font-medium">{bill.consumer.user.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {bill.consumer.consumerNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    {MONTH_NAMES[bill.billingMonth - 1]} {bill.billingYear}
                  </TableCell>
                  <TableCell>{bill.unitsConsumed} kWh</TableCell>
                  <TableCell>₹{bill.energyCharge}</TableCell>
                  <TableCell>₹{bill.fixedCharge}</TableCell>
                  <TableCell>₹{bill.taxAmount}</TableCell>
                  <TableCell className="font-bold">
                    ₹{bill.totalAmount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[bill.status]}>
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/billing/${bill.id}`}>View</Link>
                      </Button>
                      <BillStatusButtons
                        billId={bill.id}
                        currentStatus={bill.status}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
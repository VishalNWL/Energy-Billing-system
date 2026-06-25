"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markBillAsPaid, markBillAsOverdue } from "@/lib/actions/billing";

export function BillStatusButtons({
  billId,
  currentStatus,
}: {
  billId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleMarkPaid() {
    startTransition(async () => {
      await markBillAsPaid(billId);
    });
  }

  function handleMarkOverdue() {
    startTransition(async () => {
      await markBillAsOverdue(billId);
    });
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "PAID" && (
        <Button size="sm" onClick={handleMarkPaid} disabled={isPending}>
          Mark Paid
        </Button>
      )}
      {currentStatus === "PENDING" && (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleMarkOverdue}
          disabled={isPending}
        >
          Mark Overdue
        </Button>
      )}
    </div>
  );
}
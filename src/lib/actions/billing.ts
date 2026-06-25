"use server";

import { requireRole } from "@/lib/auth";
import { generateBill, generateBillsForAllConsumers } from "@/lib/billing/engine";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function generateSingleBill(
  consumerId: string,
  billingMonth: number,
  billingYear: number
) {
  await requireRole(["ADMIN", "ENGINEER"]);
  const result = await generateBill(consumerId, billingMonth, billingYear);
  revalidatePath("/admin/billing");
  return result;
}

export async function generateBulkBills(billingMonth: number, billingYear: number) {
  await requireRole(["ADMIN"]);
  const summary = await generateBillsForAllConsumers(billingMonth, billingYear);
  revalidatePath("/admin/billing");
  return summary;
}

export async function markBillAsPaid(billId: string) {
  await requireRole(["ADMIN", "ENGINEER"]);

  await prisma.bill.update({
    where: { id: billId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  revalidatePath("/admin/billing");
  return { success: true };
}

export async function markBillAsOverdue(billId: string) {
  await requireRole(["ADMIN"]);

  await prisma.bill.update({
    where: { id: billId },
    data: { status: "OVERDUE" },
  });

  revalidatePath("/admin/billing");
  return { success: true };
}

export async function getAllBills() {
  return prisma.bill.findMany({
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
    include: {
      consumer: {
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function getBillById(billId: string) {
  return prisma.bill.findUnique({
    where: { id: billId },
    include: {
      consumer: {
        include: {
          user: { select: { name: true, email: true } },
          meter: { select: { meterNumber: true } },
          transformer: {
            include: { feeder: { select: { feederName: true } } },
          },
          solarPlant: true,
        },
      },
    },
  });
}
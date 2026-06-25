"use server";

import { requireRole } from "@/lib/auth";
import {
  generateTodBill,
  getConsumersWithTodReadings,
} from "@/lib/billing/tod-engine";

export async function generateTodBillAction(
  consumerId: string,
  billingMonth: number,
  billingYear: number
) {
  await requireRole(["ADMIN", "ENGINEER"]);
  return generateTodBill(consumerId, billingMonth, billingYear);
}

export async function getConsumersWithTodAction() {
  await requireRole(["ADMIN", "ENGINEER"]);
  return getConsumersWithTodReadings();
}
import { prisma } from "@/lib/prisma";

export async function getAdminDashboardStats() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [
    totalConsumers,
    totalTransformers,
    totalFeeders,
    totalSolarUsers,
    revenueAgg,
    consumerTypeBreakdown,
  ] = await Promise.all([
    prisma.consumer.count(),
    prisma.transformer.count(),
    prisma.feeder.count(),
    prisma.solarPlant.count({ where: { isActive: true } }),
    prisma.bill.aggregate({
      _sum: { totalAmount: true },
      where: { billingYear: currentYear, billingMonth: currentMonth },
    }),
    prisma.consumer.groupBy({
      by: ["consumerType"],
      _count: { _all: true },
    }),
  ]);

  return {
    totalConsumers,
    totalTransformers,
    totalFeeders,
    totalSolarUsers,
    currentMonthRevenue: revenueAgg._sum.totalAmount ?? 0,
    consumerTypeBreakdown,
  };
}

export async function getMonthlyConsumptionTrend() {
  // Last 6 months of total units consumed, grouped by month/year
  const bills = await prisma.bill.groupBy({
    by: ["billingYear", "billingMonth"],
    _sum: { unitsConsumed: true, totalAmount: true },
    orderBy: [{ billingYear: "asc" }, { billingMonth: "asc" }],
  });

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return bills.slice(-6).map((b) => ({
    month: `${monthNames[b.billingMonth - 1]} ${b.billingYear}`,
    units: b._sum.unitsConsumed ?? 0,
    revenue: b._sum.totalAmount ?? 0,
  }));
}

export async function getAllUsersForAdmin() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { consumer: { select: { consumerNumber: true } } },
  });
}
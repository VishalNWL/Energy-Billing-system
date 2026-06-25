import { Users, Zap, GitBranch, Sun, IndianRupee } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { ConsumptionTrendChart } from "@/components/admin/consumption-trend-chart";
import { ConsumerTypeChart } from "@/components/admin/consumer-type-chart";
import { UserRoleTable } from "@/components/admin/user-role-table";
import {
  getAdminDashboardStats,
  getMonthlyConsumptionTrend,
  getAllUsersForAdmin,
} from "@/lib/queries/admin-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const [stats, trend, users] = await Promise.all([
    getAdminDashboardStats(),
    getMonthlyConsumptionTrend(),
    getAllUsersForAdmin(),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System-wide overview of consumers, infrastructure, and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Consumers"
          value={stats.totalConsumers}
          icon={Users}
        />
        <StatCard
          title="This Month's Revenue"
          value={`₹${stats.currentMonthRevenue.toLocaleString("en-IN")}`}
          icon={IndianRupee}
        />
        <StatCard
          title="Transformers"
          value={stats.totalTransformers}
          icon={Zap}
        />
        <StatCard
          title="Feeders"
          value={stats.totalFeeders}
          icon={GitBranch}
        />
        <StatCard
          title="Solar Users"
          value={stats.totalSolarUsers}
          icon={Sun}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsumptionTrendChart data={trend} />
        </div>
        <ConsumerTypeChart data={stats.consumerTypeBreakdown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User & Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
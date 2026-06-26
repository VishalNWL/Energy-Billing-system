import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "ENGINEER"]);
  return <div className="min-h-screen">{children}</div>;
}
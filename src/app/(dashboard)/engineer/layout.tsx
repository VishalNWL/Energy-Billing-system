import { requireRole } from "@/lib/auth";

export default async function EngineerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ENGINEER", "ADMIN"]);
  return <div className="min-h-screen">{children}</div>;
}
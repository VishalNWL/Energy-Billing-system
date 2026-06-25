import { requireRole } from "@/lib/auth";

export default async function ConsumerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["CONSUMER", "ADMIN"]);
  return <div className="min-h-screen">{children}</div>;
}
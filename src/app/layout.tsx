import { getCurrentDbUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getCurrentDbUser();

  if (!dbUser) redirect("/sign-in");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={dbUser.role}
        userName={dbUser.name}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
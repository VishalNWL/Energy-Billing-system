import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getCurrentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { consumer: true },
  });

  return dbUser;
}

export async function requireRole(allowedRoles: Array<"ADMIN" | "ENGINEER" | "CONSUMER">) {
  const dbUser = await getCurrentDbUser();

  if (!dbUser) {
    redirect("/sign-in");
  }

  if (!allowedRoles.includes(dbUser.role)) {
    redirect("/unauthorized");
  }

  return dbUser;
}

export async function requireUser() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/sign-in");
  return dbUser;
}
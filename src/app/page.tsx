import { getCurrentDbUser } from "@/lib/auth";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  
  if (!userId) {
    redirect("/sign-in");
  }

  let dbUser = await getCurrentDbUser();

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name =
        [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ") || "Unnamed User";

      dbUser = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: {
          clerkId: userId,
          email,
          name,
          role: "CONSUMER",
        },
        include: { consumer: true },
      });
    }
  }

  if (!dbUser) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-xl font-semibold">Setting up your account...</h1>
        <p className="text-muted-foreground text-sm">
          Please refresh in a few seconds.
        </p>
      </div>
    );
  }

  switch (dbUser.role) {
    case "ADMIN":
      redirect("/admin");
    case "ENGINEER":
      redirect("/engineer");
    case "CONSUMER":
    default:
      redirect("/consumer");
  }
}
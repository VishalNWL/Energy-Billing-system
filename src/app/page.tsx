import { getCurrentDbUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const dbUser = await getCurrentDbUser();

  if (!dbUser) {
    redirect("/sign-in");
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
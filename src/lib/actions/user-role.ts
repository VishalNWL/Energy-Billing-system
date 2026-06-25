"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(
  targetUserId: string,
  newRole: "ADMIN" | "ENGINEER" | "CONSUMER"
) {
  // Only an Admin can promote/demote anyone
  await requireRole(["ADMIN"]);

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  // Sync into Clerk's publicMetadata so middleware (session claims) sees it too
  const client = await clerkClient();
  await client.users.updateUserMetadata(updatedUser.clerkId, {
    publicMetadata: { role: newRole },
  });

  revalidatePath("/admin");

  return { success: true, user: updatedUser };
}
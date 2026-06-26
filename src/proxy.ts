import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/unauthorized",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    await auth.protect();
    return;
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)
    ?.role;

  // Consumers cannot access /admin or /engineer routes
  if (
    req.nextUrl.pathname.startsWith("/admin") &&
    role !== "ADMIN" &&
    role !== "ENGINEER"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Engineers and Admins cannot access /consumer routes
  if (
    req.nextUrl.pathname.startsWith("/consumer") &&
    role !== "CONSUMER" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
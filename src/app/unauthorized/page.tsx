import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="text-muted-foreground text-center max-w-md">
        You don&apos;t have permission to view this page.
      </p>
      <SignOutButton redirectUrl="/sign-in">
        <Button variant="outline">Sign Out and try a different account</Button>
      </SignOutButton>
    </div>
  );
}
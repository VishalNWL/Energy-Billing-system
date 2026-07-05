import { requireRole } from "@/lib/auth";
import { ConsumerForm } from "@/components/admin/consumer-form";

export default async function NewConsumerPage() {
  await requireRole(["ADMIN", "ENGINEER"]);

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Consumer</h1>
        <p className="text-muted-foreground">
          Register a new electricity consumer and assign a meter.
        </p>
      </div>
      <ConsumerForm mode="create" />
    </div>
  );
}
import { requireRole } from "@/lib/auth";
import { getConsumersWithoutSolar } from "@/lib/actions/solar";
import { SolarRegistrationForm } from "@/components/admin/solar/solar-registration-form";

export default async function SolarRegisterPage() {
  await requireRole(["ADMIN", "ENGINEER"]);
  const consumers = await getConsumersWithoutSolar();

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Register Solar Plant</h1>
        <p className="text-muted-foreground">
          Register a new rooftop solar installation for net metering.
        </p>
      </div>

      {consumers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          All consumers already have solar plants registered.
        </p>
      ) : (
        <SolarRegistrationForm consumers={consumers} />
      )}
    </div>
  );
}
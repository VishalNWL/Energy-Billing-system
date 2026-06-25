import { z } from "zod";

export const feederEnergyReadingSchema = z.object({
  energySuppliedKWh: z
    .number({ error: "Must be a number" })
    .nonnegative("Energy supplied cannot be negative"),
  energyBilledKWh: z
    .number({ error: "Must be a number" })
    .nonnegative()
    .optional(),
  readingDate: z.string().min(1, "Reading date is required"),
});

export type FeederEnergyReadingFormData = z.infer<
  typeof feederEnergyReadingSchema
>;
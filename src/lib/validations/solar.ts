import { z } from "zod";

export const solarRegistrationSchema = z.object({
  consumerId: z.string().min(1, "Consumer is required"),
  installedCapacityKW: z
    .number({ error: "Must be a number" })
    .positive("Capacity must be positive")
    .max(500, "Maximum capacity is 500 kW"),
  installationDate: z.string().min(1, "Installation date is required"),
});

export const solarGenerationUpdateSchema = z.object({
  generatedUnits: z
    .number({ error: "Must be a number" })
    .nonnegative("Generated units cannot be negative"),
});

export type SolarRegistrationFormData = z.infer<
  typeof solarRegistrationSchema
>;
export type SolarGenerationUpdateFormData = z.infer<
  typeof solarGenerationUpdateSchema
>;
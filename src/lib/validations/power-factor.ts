import { z } from "zod";

export const powerFactorSchema = z.object({
  activePowerKW: z
    .number({ error: "Must be a number" })
    .positive("Active power must be positive"),
  reactivePowerKVAR: z
    .number({ error: "Must be a number" })
    .nonnegative("Reactive power cannot be negative"),
  readingDate: z.string().min(1, "Reading date is required"),
});

export type PowerFactorFormData = z.infer<typeof powerFactorSchema>;
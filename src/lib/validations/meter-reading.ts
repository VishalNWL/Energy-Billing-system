import { z } from "zod";

export const meterReadingSchema = z.object({
  reading: z
    .number({ error: "Reading must be a number" })
    .nonnegative("Reading cannot be negative"),
  readingDate: z.string().min(1, "Reading date is required"),
  peakUnits: z
    .number({ error: "Must be a number" })
    .nonnegative()
    .optional(),
  dayUnits: z
    .number({ error: "Must be a number" })
    .nonnegative()
    .optional(),
  offPeakUnits: z
    .number({ error: "Must be a number" })
    .nonnegative()
    .optional(),
});

export type MeterReadingFormData = z.infer<typeof meterReadingSchema>;
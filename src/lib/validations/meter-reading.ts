import { z } from "zod";

export const meterReadingSchema = z.object({
  reading: z
    .number({ error: "Reading must be a number" })
    .nonnegative("Reading cannot be negative"),
  readingDate: z.string().min(1, "Reading date is required"),
});

export type MeterReadingFormData = z.infer<typeof meterReadingSchema>;
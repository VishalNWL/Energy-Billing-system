import { z } from "zod";

export const demandReadingSchema = z.object({
  demandKW: z
    .number({ error: "Must be a number" })
    .positive("Demand must be positive"),
  readingDate: z.string().min(1, "Reading date is required"),
});

export type DemandReadingFormData = z.infer<typeof demandReadingSchema>;
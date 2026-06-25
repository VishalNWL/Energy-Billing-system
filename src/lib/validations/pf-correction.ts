import { z } from "zod";

export const pfCorrectionSchema = z.object({
  activePowerKW: z
    .number({ error: "Must be a number" })
    .positive("Active power must be positive"),
  currentPF: z
    .number({ error: "Must be a number" })
    .min(0.1, "PF must be at least 0.1")
    .max(0.99, "PF must be less than 1.0"),
  targetPF: z
    .number({ error: "Must be a number" })
    .min(0.8, "Target PF must be at least 0.8")
    .max(1.0, "Target PF cannot exceed 1.0"),
  supplyVoltageV: z
    .number({ error: "Must be a number" })
    .positive()
    .optional(),
}).refine((data) => data.targetPF > data.currentPF, {
  message: "Target PF must be greater than current PF",
  path: ["targetPF"],
});

export type PFCorrectionFormData = z.infer<typeof pfCorrectionSchema>;
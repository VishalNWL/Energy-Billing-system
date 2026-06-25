import { z } from "zod";

export const consumerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  consumerNumber: z
    .string()
    .min(4, "Consumer number must be at least 4 characters")
    .regex(/^[A-Z0-9-]+$/, "Only uppercase letters, numbers, and hyphens allowed"),
  consumerType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]),
  address: z.string().min(10, "Address must be at least 10 characters"),
  sanctionedLoad: z
    .number({ error: "Must be a number" })
    .positive("Sanctioned load must be positive"),
  contractedDemand: z
    .number({ error: "Must be a number" })
    .positive()
    .optional(),
  connectedTransformerId: z.string().optional(),
  meterNumber: z
    .string()
    .min(4, "Meter number must be at least 4 characters")
    .regex(/^[A-Z0-9-]+$/, "Only uppercase letters, numbers, and hyphens allowed"),
});

export type ConsumerFormData = z.infer<typeof consumerSchema>;
import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
  createdAt: z.number().optional(),
});

export type Tenant = z.infer<typeof tenantSchema>;

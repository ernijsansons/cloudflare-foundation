import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  name: z.string().max(255).optional(),
  createdAt: z.number().optional(),
});

export type User = z.infer<typeof userSchema>;

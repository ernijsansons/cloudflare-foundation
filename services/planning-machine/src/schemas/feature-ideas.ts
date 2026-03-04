import { z } from "zod";

export const FeatureIdeaSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["proposed", "accepted", "rejected", "implemented"]).default("proposed"),
});

export type FeatureIdea = z.infer<typeof FeatureIdeaSchema>;

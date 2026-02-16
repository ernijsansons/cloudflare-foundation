import { z } from "zod";

export const OpportunityVariantSchema = z.object({
  idea: z.string(),
  description: z.string(),
  revenuePotential: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]),
  customerUrgency: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]),
  competitionDensity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  feasibility: z.enum(["HIGH", "MEDIUM", "LOW"]),
  agenticScore: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  reasoning: z.string(),
  sources: z.array(z.object({
    claim: z.string(),
    url: z.string(),
    snippet: z.string().optional(),
  })).optional(),
});

export const OpportunityOutputSchema = z.object({
  originalIdea: z.string(),
  refinedOpportunities: z.array(OpportunityVariantSchema),
  recommendedIndex: z.number(),
  keyInsight: z.string(),
  unknowns: z.array(z.string()),
});

export type OpportunityOutput = z.infer<typeof OpportunityOutputSchema>;

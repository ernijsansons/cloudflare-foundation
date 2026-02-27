import { z } from "zod";

export const OpportunityVariantSchema = z.object({
  idea: z.string().nullish(),
  description: z.string().nullish(),
  revenuePotential: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]).nullish(),
  customerUrgency: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]).nullish(),
  competitionDensity: z.enum(["LOW", "MEDIUM", "HIGH"]).nullish(),
  feasibility: z.enum(["HIGH", "MEDIUM", "LOW"]).nullish(),
  agenticScore: z.enum(["HIGH", "MEDIUM", "LOW"]).nullish(),
  reasoning: z.string().nullish(),
  sources: z.array(z.object({
    claim: z.string().nullish(),
    url: z.string().nullish(),
    snippet: z.string().nullish(),
  })).nullish().default([]),
});

export const OpportunityOutputSchema = z.object({
  originalIdea: z.string().nullish(),
  refinedOpportunities: z.array(OpportunityVariantSchema).nullish().default([]),
  recommendedIndex: z.number().nullish(),
  keyInsight: z.string().nullish(),
  unknowns: z.array(z.string()).nullish().default([]),
});

export type OpportunityOutput = z.infer<typeof OpportunityOutputSchema>;

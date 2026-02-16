import { z } from "zod";

export const AdjacentProductSchema = z.object({
  product: z.string(),
  description: z.string(),
  revenueCeiling: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]),
  implementationEffort: z.enum(["LOW", "MEDIUM", "HIGH"]),
  audienceOverlap: z.number().min(0).max(1),
  agenticPotential: z.enum(["HIGH", "MEDIUM", "LOW"]),
  reasoning: z.string(),
  sources: z.array(z.object({
    claim: z.string(),
    url: z.string().optional(),
  })).optional(),
});

export const UpsellFeatureSchema = z.object({
  feature: z.string(),
  description: z.string(),
  willingnessToPayEvidence: z.string(),
  revenueImpact: z.enum(["HIGH", "MEDIUM", "LOW"]),
  effortToAdd: z.enum(["LOW", "MEDIUM", "HIGH"]),
  agenticValue: z.string().optional(),
});

export const RevenueRankingItemSchema = z.object({
  id: z.string(),
  type: z.enum(["primary", "adjacent", "upsell"]),
  name: z.string(),
  revenuePotential: z.number().optional(),
  speedToRevenue: z.enum(["FAST", "MEDIUM", "SLOW"]),
  agenticDepth: z.enum(["deep", "surface", "none"]),
  rank: z.number(),
});

export const RevenueExpansionOutputSchema = z.object({
  primaryProduct: z.string(),
  adjacentProducts: z.array(AdjacentProductSchema),
  upsellFeatures: z.array(UpsellFeatureSchema),
  ecosystemStrategy: z.string(),
  agenticValueChain: z.string(),
  palantirLessons: z.array(z.string()),
  revenueRanking: z.array(RevenueRankingItemSchema),
});

export type RevenueExpansionOutput = z.infer<typeof RevenueExpansionOutputSchema>;
export type AdjacentProduct = z.infer<typeof AdjacentProductSchema>;
export type UpsellFeature = z.infer<typeof UpsellFeatureSchema>;
export type RevenueRankingItem = z.infer<typeof RevenueRankingItemSchema>;

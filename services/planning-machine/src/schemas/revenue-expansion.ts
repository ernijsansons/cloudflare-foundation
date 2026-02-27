import { z } from "zod";

// Helper to accept string or object with value property
const stringOrObject = z.union([
  z.string(),
  z.object({}).passthrough(),
]).nullish();

// Helper to accept array or object
const arrayOrObject = z.union([
  z.array(z.any()),
  z.object({}).passthrough(),
]).nullish();

export const AdjacentProductSchema = z.object({
  product: stringOrObject,
  description: stringOrObject,
  revenueCeiling: z.union([
    z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]),
    z.string(),
    z.number(),
  ]).nullish(),
  implementationEffort: z.union([
    z.enum(["LOW", "MEDIUM", "HIGH"]),
    z.string(),
    z.number(),
  ]).nullish(),
  audienceOverlap: z.union([z.number(), z.string()]).nullish(),
  agenticPotential: z.union([
    z.enum(["HIGH", "MEDIUM", "LOW"]),
    z.string(),
    z.number(),
  ]).nullish(),
  reasoning: stringOrObject,
  sources: arrayOrObject,
});

export const UpsellFeatureSchema = z.object({
  feature: stringOrObject,
  description: stringOrObject,
  willingnessToPayEvidence: stringOrObject,
  revenueImpact: z.union([
    z.enum(["HIGH", "MEDIUM", "LOW"]),
    z.string(),
    z.number(),
  ]).nullish(),
  effortToAdd: z.union([
    z.enum(["LOW", "MEDIUM", "HIGH"]),
    z.string(),
    z.number(),
  ]).nullish(),
  agenticValue: stringOrObject,
});

export const RevenueRankingItemSchema = z.object({
  id: stringOrObject,
  type: z.union([
    z.enum(["primary", "adjacent", "upsell"]),
    z.string(),
    z.number(),
  ]).nullish(),
  name: stringOrObject,
  revenuePotential: z.union([z.number(), z.string()]).nullish(),
  speedToRevenue: z.union([
    z.enum(["FAST", "MEDIUM", "SLOW"]),
    z.string(),
    z.number(),
  ]).nullish(),
  agenticDepth: z.union([
    z.enum(["deep", "surface", "none"]),
    z.string(),
    z.number(),
  ]).nullish(),
  rank: z.union([z.number(), z.string()]).nullish(),
});

export const RevenueExpansionOutputSchema = z.object({
  primaryProduct: stringOrObject,
  adjacentProducts: z.union([
    z.array(AdjacentProductSchema),
    z.object({}).passthrough(),
  ]).nullish().default([]),
  upsellFeatures: z.union([
    z.array(UpsellFeatureSchema),
    z.object({}).passthrough(),
  ]).nullish().default([]),
  ecosystemStrategy: stringOrObject,
  agenticValueChain: stringOrObject,
  palantirLessons: arrayOrObject.default([]),
  revenueRanking: z.union([
    z.array(RevenueRankingItemSchema),
    z.object({}).passthrough(),
  ]).nullish().default([]),
});

export type RevenueExpansionOutput = z.infer<typeof RevenueExpansionOutputSchema>;
export type AdjacentProduct = z.infer<typeof AdjacentProductSchema>;
export type UpsellFeature = z.infer<typeof UpsellFeatureSchema>;
export type RevenueRankingItem = z.infer<typeof RevenueRankingItemSchema>;

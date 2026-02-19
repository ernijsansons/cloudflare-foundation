import { z } from "zod";

// Helper to accept string or object
const stringOrObject = z.union([
  z.string(),
  z.object({}).passthrough(),
]).nullish();

// Helper to accept array or object
const arrayOrObject = z.union([
  z.array(z.any()),
  z.object({}).passthrough(),
]).nullish();

export const StrategyOutputSchema = z.object({
  positioning: z.union([
    z.object({
      for: stringOrObject,
      who: stringOrObject,
      product: stringOrObject,
      category: stringOrObject,
      keyBenefit: stringOrObject,
      unlike: stringOrObject,
      competitorWeakness: stringOrObject,
      fullStatement: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  strategicNarrative: z.union([
    z.object({
      whatIsChanging: stringOrObject,
      whyInevitable: stringOrObject,
      agenticVision: stringOrObject,
      dataFlywheel: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  brandVoice: z.union([
    z.object({
      tone: stringOrObject,
      personality: stringOrObject,
      wordsToUse: arrayOrObject,
      wordsToNeverUse: arrayOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  wedgeStrategy: z.union([
    z.object({
      smallestProduct: stringOrObject,
      fullValueTo: stringOrObject,
      reasoning: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  differentiationAxes: arrayOrObject.default([]),
  moatStrategy: z.union([
    z.object({
      howGetsHarder: stringOrObject,
      timeline: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  nameSuggestions: z.union([
    z.array(z.object({
      name: stringOrObject,
      domainCheckQuery: stringOrObject,
    })),
    z.object({}).passthrough(),
  ]).nullish().default([]),
});

export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;

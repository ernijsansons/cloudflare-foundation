import { z } from "zod";

export const MarketSizeSchema = z.object({
  tam: z.string().optional(),
  tamSource: z.string().optional(),
  tamConfidence: z.enum(["high", "medium", "low"]).optional(),
  sam: z.string().optional(),
  samSource: z.string().optional(),
  samConfidence: z.enum(["high", "medium", "low"]).optional(),
  som: z.string().optional(),
  somSource: z.string().optional(),
  somConfidence: z.enum(["high", "medium", "low"]).optional(),
});

export const PricingLandscapeItemSchema = z.object({
  competitor: z.string(),
  tiers: z.array(z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()).optional(),
  })),
  url: z.string().optional(),
});

export const PricingPsychologySchema = z.object({
  strategy: z.string(),
  reasoning: z.string(),
  anchoring: z.string().optional(),
  decoy: z.string().optional(),
  freemiumVsTrial: z.string().optional(),
  annualVsMonthly: z.string().optional(),
});

export const PriceRangesSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  recommended: z.string().optional(),
  evidence: z.string().optional(),
});

export const MarketResearchOutputSchema = z.object({
  marketSize: MarketSizeSchema,
  growthRate: z.string().optional(),
  growthRateSource: z.string().optional(),
  marketTiming: z.object({
    whyNow: z.string().optional(),
    whatChanged: z.string().optional(),
    tailwinds: z.array(z.string()).optional(),
    headwinds: z.array(z.string()).optional(),
  }).optional(),
  pricingLandscape: z.array(PricingLandscapeItemSchema),
  pricingPsychology: PricingPsychologySchema,
  priceRanges: PriceRangesSchema.optional(),
  regulatoryFactors: z.array(z.string()).optional(),
  marketRisks: z.array(z.string()).optional(),
});

export type MarketResearchOutput = z.infer<typeof MarketResearchOutputSchema>;

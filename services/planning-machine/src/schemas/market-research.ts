import { z } from "zod";

export const MarketSizeSchema = z.object({
  tam: z.string().nullish(),
  tamSource: z.string().nullish(),
  tamConfidence: z.enum(["high", "medium", "low"]).nullish(),
  sam: z.string().nullish(),
  samSource: z.string().nullish(),
  samConfidence: z.enum(["high", "medium", "low"]).nullish(),
  som: z.string().nullish(),
  somSource: z.string().nullish(),
  somConfidence: z.enum(["high", "medium", "low"]).nullish(),
}).nullish();

export const PricingLandscapeItemSchema = z.object({
  competitor: z.string().nullish(),
  tiers: z.array(z.object({
    name: z.string().nullish(),
    price: z.string().nullish(),
    features: z.array(z.string()).nullish(),
  })).nullish(),
  url: z.string().nullish(),
});

export const PricingPsychologySchema = z.object({
  strategy: z.string().nullish(),
  reasoning: z.string().nullish(),
  anchoring: z.string().nullish(),
  decoy: z.string().nullish(),
  freemiumVsTrial: z.string().nullish(),
  annualVsMonthly: z.string().nullish(),
}).nullish();

export const PriceRangesSchema = z.object({
  min: z.number().nullish(),
  max: z.number().nullish(),
  recommended: z.string().nullish(),
  evidence: z.string().nullish(),
}).nullish();

// Accept both array and object for marketRisks
const MarketRisksSchema = z.union([
  z.array(z.string()),
  z.object({}).passthrough(),
  z.string(),
]).nullish();

export const MarketResearchOutputSchema = z.object({
  marketSize: MarketSizeSchema,
  growthRate: z.string().nullish(),
  growthRateSource: z.string().nullish(),
  marketTiming: z.object({
    whyNow: z.string().nullish(),
    whatChanged: z.string().nullish(),
    tailwinds: z.array(z.string()).nullish(),
    headwinds: z.array(z.string()).nullish(),
  }).nullish(),
  pricingLandscape: z.array(PricingLandscapeItemSchema).nullish(),
  pricingPsychology: PricingPsychologySchema,
  priceRanges: PriceRangesSchema,
  regulatoryFactors: z.array(z.string()).nullish(),
  marketRisks: MarketRisksSchema,
});

export type MarketResearchOutput = z.infer<typeof MarketResearchOutputSchema>;

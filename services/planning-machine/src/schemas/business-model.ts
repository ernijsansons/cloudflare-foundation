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

export const PricingTierSchema = z.object({
  name: stringOrObject,
  price: stringOrObject,
  priceMonthly: z.union([z.number(), z.string()]).nullish(),
  features: arrayOrObject.default([]),
  psychologyReasoning: stringOrObject,
  anchoringTrick: stringOrObject,
});

export const BootstrapMilestonesSchema = z.union([
  z.object({
    firstDollar: z.union([
      z.object({
        how: stringOrObject,
        when: stringOrObject,
        fromWhom: stringOrObject,
      }),
      z.string(),
      z.object({}).passthrough(),
    ]).nullish(),
    first1KMRR: z.union([
      z.object({
        timeline: stringOrObject,
        customerCount: z.union([z.number(), z.string()]).nullish(),
      }),
      z.string(),
      z.object({}).passthrough(),
    ]).nullish(),
    first10KMRR: z.union([
      z.object({
        timeline: stringOrObject,
        whatChanges: stringOrObject,
      }),
      z.string(),
      z.object({}).passthrough(),
    ]).nullish(),
    ramenProfitable: z.union([
      z.object({
        when: stringOrObject,
        monthlyCosts: stringOrObject,
      }),
      z.string(),
      z.object({}).passthrough(),
    ]).nullish(),
  }),
  z.string(),
  z.object({}).passthrough(),
]).nullish();

export const CostStructureSchema = z.union([
  z.object({
    cloudflareServices: z.union([
      z.object({
        workers: stringOrObject,
        d1: stringOrObject,
        r2: stringOrObject,
        kv: stringOrObject,
        at0Users: stringOrObject,
        at1000Users: stringOrObject,
      }),
      z.string(),
      z.object({}).passthrough(),
    ]).nullish(),
    thirdPartyServices: arrayOrObject.default([]),
    monthlyBurnByStage: z.union([z.record(z.any()), z.object({}).passthrough()]).nullish(),
  }),
  z.string(),
  z.object({}).passthrough(),
]).nullish();

export const StripeConfigSchema = z.union([
  z.object({
    products: arrayOrObject.default([]),
    checkoutVsEmbedded: stringOrObject,
    webhookEvents: arrayOrObject.default([]),
  }),
  z.string(),
  z.object({}).passthrough(),
]).nullish();

export const BusinessModelOutputSchema = z.object({
  revenueModel: z.union([
    z.object({
      type: stringOrObject,
      reasoning: stringOrObject,
      bootstrapFriendlinessScore: z.union([z.number(), z.string()]).nullish(),
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  agenticPricingModel: z.union([
    z.object({
      outcomeBasedPricing: stringOrObject,
      usageBasedModel: stringOrObject,
      agentDeliveredValue: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  expansionRevenue: z.union([
    z.object({
      adjacentProducts: arrayOrObject.default([]),
      upsellFeatures: arrayOrObject.default([]),
      timeline: stringOrObject,
      revenuePotential: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  pricingTiers: z.union([
    z.array(PricingTierSchema),
    z.object({}).passthrough(),
  ]).nullish().default([]),
  unitEconomics: z.union([
    z.object({
      cac: stringOrObject,
      ltv: stringOrObject,
      ltvCacRatio: stringOrObject,
      paybackPeriod: stringOrObject,
    }),
    z.string(),
    z.object({}).passthrough(),
  ]).nullish(),
  bootstrapMilestones: BootstrapMilestonesSchema,
  costStructure: CostStructureSchema,
  breakEvenTimeline: stringOrObject,
  stripeConfiguration: StripeConfigSchema,
});

export type BusinessModelOutput = z.infer<typeof BusinessModelOutputSchema>;

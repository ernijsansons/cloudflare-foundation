import { z } from "zod";

export const PricingTierSchema = z.object({
  name: z.string(),
  price: z.string(),
  priceMonthly: z.number().optional(),
  features: z.array(z.string()),
  psychologyReasoning: z.string().optional(),
  anchoringTrick: z.string().optional(),
});

export const BootstrapMilestonesSchema = z.object({
  firstDollar: z.object({
    how: z.string(),
    when: z.string(),
    fromWhom: z.string().optional(),
  }).optional(),
  first1KMRR: z.object({
    timeline: z.string(),
    customerCount: z.number().optional(),
  }).optional(),
  first10KMRR: z.object({
    timeline: z.string(),
    whatChanges: z.string().optional(),
  }).optional(),
  ramenProfitable: z.object({
    when: z.string(),
    monthlyCosts: z.string().optional(),
  }).optional(),
});

export const CostStructureSchema = z.object({
  cloudflareServices: z.object({
    workers: z.string().optional(),
    d1: z.string().optional(),
    r2: z.string().optional(),
    kv: z.string().optional(),
    at0Users: z.string().optional(),
    at1000Users: z.string().optional(),
  }).optional(),
  thirdPartyServices: z.array(z.object({
    service: z.string(),
    cost: z.string(),
    atWhatScale: z.string().optional(),
  })).optional(),
  monthlyBurnByStage: z.record(z.string()).optional(),
});

export const StripeConfigSchema = z.object({
  products: z.array(z.object({
    name: z.string(),
    prices: z.array(z.object({
      id: z.string().optional(),
      amount: z.number(),
      interval: z.enum(["month", "year"]),
      currency: z.string().default("usd"),
    })),
  })).optional(),
  checkoutVsEmbedded: z.string().optional(),
  webhookEvents: z.array(z.string()).optional(),
});

export const BusinessModelOutputSchema = z.object({
  revenueModel: z.object({
    type: z.string(),
    reasoning: z.string(),
    bootstrapFriendlinessScore: z.number().optional(),
  }),
  agenticPricingModel: z.object({
    outcomeBasedPricing: z.string().optional(),
    usageBasedModel: z.string().optional(),
    agentDeliveredValue: z.string().optional(),
  }).optional(),
  expansionRevenue: z.object({
    adjacentProducts: z.array(z.string()).optional(),
    upsellFeatures: z.array(z.string()).optional(),
    timeline: z.string().optional(),
    revenuePotential: z.string().optional(),
  }).optional(),
  pricingTiers: z.array(PricingTierSchema),
  unitEconomics: z.object({
    cac: z.string().optional(),
    ltv: z.string().optional(),
    ltvCacRatio: z.string().optional(),
    paybackPeriod: z.string().optional(),
  }).optional(),
  bootstrapMilestones: BootstrapMilestonesSchema.optional(),
  costStructure: CostStructureSchema.optional(),
  breakEvenTimeline: z.string().optional(),
  stripeConfiguration: StripeConfigSchema.optional(),
});

export type BusinessModelOutput = z.infer<typeof BusinessModelOutputSchema>;

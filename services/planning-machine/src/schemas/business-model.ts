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

// ============================================================================
// AI COST MODELING SCHEMA (Phase 1.3)
// Critical for agentic products - AI costs can be 40-70% of COGS
// ============================================================================

export const AIModelCostSchema = z.object({
  provider: z.enum(["workers-ai", "anthropic", "openai", "custom"]),
  model: z.string(),
  costPerToken: z.object({
    input: z.number(),
    output: z.number(),
  }),
  projectedMonthlyTokens: z.object({
    free: z.number(),
    pro: z.number(),
    enterprise: z.number(),
  }),
  monthlySpend: z.object({
    free: z.string(),
    pro: z.string(),
    enterprise: z.string(),
  }),
});

export const AICostModelingSchema = z.object({
  applies: z.boolean(),
  models: z.array(AIModelCostSchema).default([]),
  aiGatewayConfig: z.object({
    enabled: z.boolean(),
    gatewayId: z.string().optional(),
    cacheTTL: z.number().optional(),  // seconds
    keyManagement: z.enum(["cloudflare-secrets", "env-vars"]).default("cloudflare-secrets"),
    costAttribution: z.object({
      enabled: z.boolean(),
      granularity: z.enum(["per-tenant", "per-user", "per-request"]),
    }).optional(),
  }).optional(),
  vectorizeCosts: z.object({
    dimensions: z.number(),
    indexedVectors: z.number(),
    queriesPerMonth: z.number(),
    estimatedCost: z.string(),
  }).optional(),
  edgeComputeCosts: z.object({
    workersRequests: z.number(),
    durableObjectsRequests: z.number(),
    d1Reads: z.number(),
    d1Writes: z.number(),
    r2Storage: z.string(),
    totalEstimate: z.string(),
    freeAllowanceRemaining: z.string(),
  }).optional(),
  totalAICostPerCustomer: z.object({
    free: z.string(),
    pro: z.string(),
    enterprise: z.string(),
  }),
});

// Gross Margin Analysis
export const GrossMarginAnalysisSchema = z.object({
  byTier: z.array(z.object({
    tier: z.string(),
    revenue: z.string(),
    cogs: z.object({
      infrastructure: z.string(),
      aiCosts: z.string(),
      thirdParty: z.string(),
      total: z.string(),
    }),
    grossMargin: z.string(),
    grossMarginPercent: z.number(),
  })),
  targetGrossMargin: z.string(),
  scalingDynamics: z.string(),
});

// Credit System Design (common for agentic SaaS)
export const CreditSystemDesignSchema = z.object({
  applies: z.boolean(),
  creditDefinition: z.string(),  // What is "1 credit"
  creditToPriceRatio: z.string(),
  overage: z.object({
    enabled: z.boolean(),
    overageRate: z.string(),
    hardCap: z.boolean(),
  }),
  rollover: z.boolean(),
  expirationPolicy: z.string(),
});

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

  // NEW: AI Cost Modeling (Phase 1.3)
  aiCostModeling: AICostModelingSchema.optional(),

  // NEW: Gross Margin Analysis (Phase 1.3)
  grossMarginAnalysis: GrossMarginAnalysisSchema.optional(),

  // NEW: Credit System Design (Phase 1.3)
  creditSystemDesign: CreditSystemDesignSchema.optional(),
});

export type BusinessModelOutput = z.infer<typeof BusinessModelOutputSchema>;

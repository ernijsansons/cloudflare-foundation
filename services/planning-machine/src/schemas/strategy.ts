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

  // Phase 2: Brand Architecture (comprehensive brand system)
  brandArchitecture: z.object({
    antiCategoryFraming: z.object({
      categoryWeReject: z.string(),
      whyWeDontFit: z.string(),
      newCategoryWereCreating: z.string(),
    }).optional(),

    visualIdentity: z.object({
      primaryBrandColor: z.object({
        hex: z.string(),
        psychology: z.string(),
        competitive: z.string(),
      }),
      secondaryColors: z.array(z.object({
        hex: z.string(),
        purpose: z.string(),
      })).default([]),
      logoDirection: z.string(),
      visualMetaphors: z.array(z.string()).default([]),
    }),

    domainStrategy: z.object({
      primaryDomain: z.object({
        suggestion: z.string(),
        availability: z.enum(["available", "check-required", "taken"]),
        cost: z.string(),
      }),
      alternativeDomains: z.array(z.object({
        domain: z.string(),
        reasoning: z.string(),
      })).default([]),
      subdomainStrategy: z.object({
        app: z.string().optional(),
        api: z.string().optional(),
        marketing: z.string().optional(),
      }),
      futureProductNaming: z.string(),
    }),

    psychologicalFramework: z.object({
      statusSignaling: z.string(),
      trustSignals: z.array(z.string()).default([]),
      anchoringMechanisms: z.array(z.string()).default([]),
      brandAssociations: z.array(z.string()).default([]),
    }),

    brandMoat: z.object({
      howBrandCompounds: z.string(),
      networkEffectsOnBrand: z.string(),
      defensivePositioning: z.string(),
    }),
  }).optional(),
});

export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;

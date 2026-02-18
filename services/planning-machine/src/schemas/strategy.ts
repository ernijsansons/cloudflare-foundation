import { z } from "zod";

export const StrategyOutputSchema = z.object({
  positioning: z.object({
    for: z.string(),
    who: z.string(),
    product: z.string(),
    category: z.string(),
    keyBenefit: z.string(),
    unlike: z.string(),
    competitorWeakness: z.string(),
    fullStatement: z.string().optional(),
  }),
  strategicNarrative: z.object({
    whatIsChanging: z.string().optional(),
    whyInevitable: z.string().optional(),
    agenticVision: z.string().optional(),
    dataFlywheel: z.string().optional(),
  }).optional(),
  brandVoice: z.object({
    tone: z.string(),
    personality: z.string(),
    wordsToUse: z.array(z.string()).optional(),
    wordsToNeverUse: z.array(z.string()).optional(),
  }),
  wedgeStrategy: z.object({
    smallestProduct: z.string(),
    fullValueTo: z.string(),
    reasoning: z.string().optional(),
  }),
  differentiationAxes: z.array(z.string()),
  moatStrategy: z.object({
    howGetsHarder: z.string(),
    timeline: z.string().optional(),
  }).optional(),
  nameSuggestions: z.array(z.object({
    name: z.string(),
    domainCheckQuery: z.string().optional(),
  })),
});

export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;

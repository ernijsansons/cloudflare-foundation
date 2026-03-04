import { z } from "zod";
import { FeatureIdeaSchema } from "./feature-ideas";
import { MarketResearchOutputSchema } from "./market-research";
import { OpportunityOutputSchema } from "./opportunity";
import { CustomerIntelOutputSchema } from "./customer-intel";
import { CompetitiveIntelOutputSchema } from "./competitive-intel";
import { BusinessModelOutputSchema } from "./business-model";
import { KillTestOutputSchema } from "./kill-test";
import { RevenueExpansionOutputSchema } from "./revenue-expansion";

export const LivingPRDSchema = z.object({
  id: z.string(),
  status: z.enum(["draft", "researching", "validating", "planning", "building", "killed", "parked"]),
  
  // Core Ideation
  coreContext: z.object({
    rawIdea: z.string(),
    refinedIdea: z.string().optional(),
    identifiedProblems: z.array(z.string()).optional(),
  }),

  // Agent State & Data
  research: z.object({
    market: MarketResearchOutputSchema.optional(),
    opportunity: OpportunityOutputSchema.optional(),
    customer: CustomerIntelOutputSchema.optional(),
    competitive: CompetitiveIntelOutputSchema.optional(),
    businessModel: BusinessModelOutputSchema.optional(),
    revenueExpansion: RevenueExpansionOutputSchema.optional(),
  }),

  // Validation
  validation: z.object({
    killTestOutput: KillTestOutputSchema.optional(),
    verdict: z.enum(["PENDING", "GO", "PIVOT", "KILL"]).default("PENDING"),
  }),
  
  // Feature Requirements & Engineering
  requirements: z.object({
    features: z.array(FeatureIdeaSchema).default([]),
    architectureNotes: z.string().optional(),
    dataModelNotes: z.string().optional(),
  }),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().default(1),
  
  // Pivot Tracking
  pivotHistory: z.array(z.object({
    timestamp: z.string(),
    reason: z.string(),
    previousVerdict: z.enum(["PENDING", "GO", "PIVOT", "KILL"]),
    agentsRerun: z.array(z.string())
  })).default([])
});

export type LivingPRDType = z.infer<typeof LivingPRDSchema>;

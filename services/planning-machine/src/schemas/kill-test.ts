import { z } from "zod";

export const BootstrapFeasibilitySchema = z.object({
  canOneSoloFounderBuild: z.boolean(),
  canOneSoloFounderBuildReasoning: z.string().optional(),
  timeToMVP: z.string().optional(),
  timeToMVPWeeks: z.number().optional(),
  canReachFirst100CustomersForFree: z.boolean(),
  canReachFirst100CustomersForFreeChannels: z.array(z.string()).optional(),
  hasFreeDist: z.boolean(),
  timeToFirstRevenue: z.string().optional(),
  timeToFirstRevenueWeeks: z.number().optional(),
  cloudflareFreeTierSufficient: z.boolean().optional(),
  cloudflareFreeTierReasoning: z.string().optional(),
});

export const AgenticAssessmentSchema = z.object({
  isAgentic: z.boolean(),
  agenticDepth: z.enum(["deep", "surface", "none"]),
  whatMakesItAgentic: z.string().optional(),
  dataCompoundingMechanism: z.string().optional(),
});

export const KillTestOutputSchema = z.object({
  verdict: z.enum(["GO", "PIVOT", "KILL"]),
  bootstrapFeasibility: BootstrapFeasibilitySchema,
  agenticAssessment: AgenticAssessmentSchema.optional(),
  fatalFlaws: z.array(z.string()),
  pivotSuggestions: z.array(z.string()).optional(),
  unfairAdvantagesNeeded: z.array(z.string()).optional(),
  riskRegister: z.array(z.object({
    risk: z.string(),
    probability: z.string().optional(),
    impact: z.string().optional(),
    mitigation: z.string().optional(),
  })).optional(),
  parkedForFuture: z.object({
    reason: z.string(),
    revisitEstimateMonths: z.number().min(6).max(24),
    note: z.string().optional(),
  }).optional(),
});

export type KillTestOutput = z.infer<typeof KillTestOutputSchema>;

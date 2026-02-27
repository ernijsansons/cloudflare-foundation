import { z } from "zod";

export const BootstrapFeasibilitySchema = z.union([
  z.string(),
  z.object({
    canOneSoloFounderBuild: z.boolean().nullish(),
    canOneSoloFounderBuildReasoning: z.string().nullish(),
    timeToMVP: z.string().nullish(),
    timeToMVPWeeks: z.number().nullish(),
    canReachFirst100CustomersForFree: z.boolean().nullish(),
    canReachFirst100CustomersForFreeChannels: z.array(z.string()).nullish(),
    hasFreeDist: z.boolean().nullish(),
    timeToFirstRevenue: z.string().nullish(),
    timeToFirstRevenueWeeks: z.number().nullish(),
    cloudflareFreeTierSufficient: z.boolean().nullish(),
    cloudflareFreeTierReasoning: z.string().nullish(),
  }),
]).nullish();

export const AgenticAssessmentSchema = z.object({
  isAgentic: z.boolean().nullish(),
  agenticDepth: z.enum(["deep", "surface", "none"]).nullish(),
  whatMakesItAgentic: z.string().nullish(),
  dataCompoundingMechanism: z.string().nullish(),
}).nullish();

// Accept either array of strings or single string
const FatalFlawsSchema = z.union([
  z.array(z.string()),
  z.string(),
]).nullish();

export const KillTestOutputSchema = z.object({
  verdict: z.enum(["GO", "PIVOT", "KILL"]).nullish().default("PIVOT"),
  bootstrapFeasibility: BootstrapFeasibilitySchema,
  agenticAssessment: AgenticAssessmentSchema,
  fatalFlaws: FatalFlawsSchema,
  pivotSuggestions: z.array(z.string()).nullish(),
  unfairAdvantagesNeeded: z.array(z.string()).nullish(),
  riskRegister: z.array(z.object({
    risk: z.string().nullish(),
    probability: z.string().nullish(),
    impact: z.string().nullish(),
    mitigation: z.string().nullish(),
  })).nullish(),
  parkedForFuture: z.object({
    reason: z.string().nullish(),
    revisitEstimateMonths: z.number().nullish(),
    note: z.string().nullish(),
  }).nullish(),
});

export type KillTestOutput = z.infer<typeof KillTestOutputSchema>;

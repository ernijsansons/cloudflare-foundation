import { z } from "zod";

export const CompetitorSchema = z.object({
  name: z.string().nullish(),
  url: z.string().nullish(),
  foundedYear: z.number().nullish(),
  fundingStatus: z.string().nullish(),
  pricing: z.object({
    tiers: z.array(z.object({
      name: z.string().nullish(),
      price: z.string().nullish(),
      features: z.array(z.string()).nullish(),
    })).nullish(),
  }).nullish(),
  strengths: z.array(z.string()).nullish(),
  weaknesses: z.array(z.string()).nullish(),
  messagingAnalysis: z.object({
    headline: z.string().nullish(),
    valueProp: z.string().nullish(),
    tone: z.string().nullish(),
    emotionalAppeals: z.array(z.string()).nullish(),
  }).nullish(),
  seoKeywords: z.array(z.string()).nullish(),
  customerComplaints: z.array(z.object({
    complaint: z.string().nullish(),
    quote: z.string().nullish(),
  })).nullish(),
  techStack: z.string().nullish(),
});

export const CompetitiveIntelOutputSchema = z.object({
  competitors: z.array(CompetitorSchema).nullish().default([]),
  positioningGaps: z.array(z.string()).nullish().default([]),
  messagingGaps: z.array(z.string()).nullish().default([]),
  pricingGaps: z.array(z.string()).nullish().default([]),
  vulnerabilities: z.array(z.string()).nullish().default([]),
  /** Citations from live competitor research — must include real competitor URLs */
  citations: z.array(z.object({
    claim: z.string(),
    url: z.string(),
    date: z.string().nullish(),
    confidence: z.enum(["high", "medium", "low"]).default("medium"),
  })).default([]),
  draftTasks: z.array(z.any()).default([]),
});

export type CompetitiveIntelOutput = z.infer<typeof CompetitiveIntelOutputSchema>;

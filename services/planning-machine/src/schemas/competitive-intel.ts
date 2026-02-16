import { z } from "zod";

export const CompetitorSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  foundedYear: z.number().optional(),
  fundingStatus: z.string().optional(),
  pricing: z.object({
    tiers: z.array(z.object({
      name: z.string(),
      price: z.string(),
      features: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  messagingAnalysis: z.object({
    headline: z.string().optional(),
    valueProp: z.string().optional(),
    tone: z.string().optional(),
    emotionalAppeals: z.array(z.string()).optional(),
  }).optional(),
  seoKeywords: z.array(z.string()).optional(),
  customerComplaints: z.array(z.object({
    complaint: z.string(),
    quote: z.string().optional(),
  })).optional(),
  techStack: z.string().optional(),
});

export const CompetitiveIntelOutputSchema = z.object({
  competitors: z.array(CompetitorSchema),
  positioningGaps: z.array(z.string()),
  messagingGaps: z.array(z.string()),
  pricingGaps: z.array(z.string()),
  vulnerabilities: z.array(z.string()),
});

export type CompetitiveIntelOutput = z.infer<typeof CompetitiveIntelOutputSchema>;

import { z } from "zod";

export const PainPointSchema = z.object({
  description: z.string(),
  severity: z.enum(["hair_on_fire", "high", "medium", "nice_to_have"]),
  exactQuote: z.string().optional(),
  source: z.string().optional(),
});

export const WateringHoleSchema = z.object({
  type: z.enum(["subreddit", "forum", "slack", "discord", "newsletter", "podcast", "twitter", "other"]),
  name: z.string(),
  url: z.string().optional(),
  memberCount: z.string().optional(),
});

export const IdealCustomerProfileSchema = z.object({
  demographics: z.object({
    jobTitle: z.string().optional(),
    companySize: z.string().optional(),
    industry: z.string().optional(),
  }),
  psychographics: z.object({
    values: z.array(z.string()).optional(),
    fears: z.array(z.string()).optional(),
    aspirations: z.array(z.string()).optional(),
    identity: z.string().optional(),
  }).optional(),
  painPoints: z.array(PainPointSchema),
  buyingTriggers: z.array(z.string()),
  currentSolutions: z.array(z.object({
    tool: z.string(),
    whatTheyPay: z.string().optional(),
    whatTheyHate: z.string().optional(),
  })).optional(),
  switchingCosts: z.string().optional(),
  wateringHoles: z.array(WateringHoleSchema),
  searchBehavior: z.array(z.string()),
  willingnessToPay: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default("USD"),
    evidence: z.string().optional(),
  }).optional(),
  decisionProcess: z.object({
    whoDecides: z.string().optional(),
    whoInfluences: z.string().optional(),
    timeline: z.string().optional(),
  }).optional(),
});

export const CustomerLanguageSchema = z.object({
  exactWords: z.array(z.string()).optional(),
  phrases: z.array(z.string()).optional(),
  metaphors: z.array(z.string()).optional(),
});

export const JobToBeDoneSchema = z.object({
  functional: z.string().optional(),
  emotional: z.string().optional(),
  social: z.string().optional(),
});

export const CustomerIntelOutputSchema = z.object({
  idealCustomerProfiles: z.array(IdealCustomerProfileSchema),
  customerLanguage: CustomerLanguageSchema,
  jobsToBeDone: z.array(JobToBeDoneSchema).optional(),
  unknowns: z.array(z.string()),
});

export type CustomerIntelOutput = z.infer<typeof CustomerIntelOutputSchema>;

import { z } from "zod";

export const GTMOutputSchema = z.object({
  seoStrategy: z.object({
    primaryKeywords: z.array(z.object({ keyword: z.string(), intent: z.string().optional() })).optional(),
    longTailKeywords: z.array(z.string()).optional(),
    contentPillars: z.array(z.string()).optional(),
    technicalSEOChecklist: z.array(z.string()).optional(),
  }),
  contentMarketing: z.object({
    blogPosts: z.array(z.object({ title: z.string(), targetKeyword: z.string().optional() })).optional(),
    contentCalendar: z.string().optional(),
    distributionPlan: z.array(z.object({ postTitle: z.string(), whereToShare: z.array(z.string()) })).optional(),
  }).optional(),
  launchPlaybook: z.object({
    preLaunch: z.object({
      buildInPublic: z.array(z.string()).optional(),
      waitlistStrategy: z.object({ leadMagnet: z.string().optional() }).optional(),
      communitySeeding: z.array(z.string()).optional(),
      betaRecruitment: z.string().optional(),
    }).optional(),
    launchDay: z.object({
      productHunt: z.object({ tagline60Chars: z.string().optional(), assetChecklist: z.array(z.string()).optional() }).optional(),
      hackerNews: z.object({ postFormat: z.string().optional() }).optional(),
      reddit: z.array(z.object({ subreddit: z.string(), approach: z.string().optional() })).optional(),
      emailBlast: z.object({ subjectLineOptions: z.array(z.string()).optional() }).optional(),
    }).optional(),
    postLaunch: z.object({
      momentumTactics: z.array(z.string()).optional(),
    }).optional(),
  }),
  emailMarketing: z.object({
    leadMagnet: z.string().optional(),
    welcomeSequence: z.array(z.object({ subject: z.string(), purpose: z.string() })).optional(),
    launchSequence: z.array(z.object({ subject: z.string() })).optional(),
  }).optional(),
  growthLoops: z.array(z.object({ type: z.string(), description: z.string() })).optional(),
  socialMedia: z.object({
    platformSelection: z.array(z.object({ platform: z.string(), reason: z.string() })).optional(),
    contentThemes: z.array(z.string()).optional(),
  }).optional(),
  microBudgetAds: z.object({
    platform: z.string().optional(),
    dailyBudget: z.string().optional(),
    adCopyVariations: z.array(z.string()).optional(),
  }).optional(),
  conversionFunnel: z.object({
    stages: z.array(z.string()).optional(),
    expectedConversionRates: z.record(z.string()).optional(),
  }).optional(),
  analyticsEventTaxonomy: z.array(z.object({
    eventName: z.string(),
    category: z.string().optional(),
    properties: z.array(z.string()).optional(),
    trigger: z.string().optional(),
  })).optional(),
});

export type GTMOutput = z.infer<typeof GTMOutputSchema>;

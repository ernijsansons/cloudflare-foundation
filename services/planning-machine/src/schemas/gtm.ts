import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const GTMOutputSchema = z.object({
  seoStrategy: anyField,
  contentMarketing: anyField,
  launchPlaybook: anyField,
  emailMarketing: anyField,
  growthLoops: anyArray,
  socialMedia: anyField,
  microBudgetAds: anyField,
  conversionFunnel: anyField,
  analyticsEventTaxonomy: anyArray,
  /**
   * Draft tasks contributed by GTM toward final TASKS.json.
   * Include: marketing campaigns, SEO tasks, launch channel tasks, ad setup.
   */
  draftTasks: anyArray,

  // Phase 2: Programmatic Growth (API-driven, marketplace, referral, affiliate, community)
  programmaticGrowth: z.object({
    apiAsDistribution: z.object({
      applies: z.boolean(),
      webhookStrategy: z.string().optional(),
      embeddableWidgets: z.array(z.object({
        widgetType: z.string(),
        targetPlatforms: z.array(z.string()),
        implementation: z.string(),
      })).optional(),
      developerDocs: z.string().optional(),
      sandboxEnvironment: z.boolean().optional(),
    }).optional(),

    marketplaceStrategy: z.object({
      applies: z.boolean(),
      targetMarketplaces: z.array(z.object({
        platform: z.enum(["Shopify", "Salesforce", "HubSpot", "Slack", "Microsoft", "Google Workspace", "Atlassian", "Zapier", "Make", "Other"]),
        fit: z.string(),
        timeline: z.string(),
      })).optional(),
      integrationDepth: z.enum(["shallow-oauth", "deep-bi-directional", "native-ui"]).optional(),
    }).optional(),

    referralEngine: z.object({
      applies: z.boolean(),
      incentiveStructure: z.object({
        referrerReward: z.string(),
        refereeReward: z.string(),
        viralCoefficient: z.string(),
      }).optional(),
      mechanics: z.string().optional(),
      trackingImplementation: z.string().optional(),
      bootstrapCost: z.string().optional(),
    }).optional(),

    affiliateProgram: z.object({
      applies: z.boolean(),
      commissionStructure: z.string().optional(),
      targetAffiliates: z.array(z.string()).optional(),
      managementTooling: z.string().optional(),
      whenToLaunch: z.string().optional(),
    }).optional(),

    partnershipStrategy: z.object({
      applies: z.boolean(),
      strategicPartners: z.array(z.object({
        type: z.enum(["integration", "reseller", "co-marketing"]),
        target: z.string(),
        value: z.string(),
        outreachPlan: z.string(),
      })).optional(),
      partnerEnablement: z.string().optional(),
    }).optional(),

    communityFlywheel: z.object({
      applies: z.boolean(),
      platformChoice: z.enum(["Discord", "Slack", "Circle", "Forum", "Reddit", "Other"]).optional(),
      seedingStrategy: z.string().optional(),
      moderationPlan: z.string().optional(),
      contributionRewards: z.string().optional(),
      ugcStrategy: z.string().optional(),
    }).optional(),
  }).optional(),
}).passthrough();

export type GTMOutput = z.infer<typeof GTMOutputSchema>;

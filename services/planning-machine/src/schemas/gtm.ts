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
}).passthrough();

export type GTMOutput = z.infer<typeof GTMOutputSchema>;

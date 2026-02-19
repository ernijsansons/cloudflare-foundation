import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const AnalyticsOutputSchema = z.object({
  eventTaxonomy: anyField,
  conversionFunnels: anyArray,
  dashboardSpec: anyField,
  abTestPlan: anyArray,
  queueMessageSchemas: anyField,
  analyticsEngineQueries: anyArray,
  /**
   * Draft tasks contributed by analytics toward final TASKS.json.
   * Include: Analytics Engine setup, event tracking implementation, dashboard tasks.
   */
  draftTasks: anyArray,
}).passthrough();

export type AnalyticsOutput = z.infer<typeof AnalyticsOutputSchema>;

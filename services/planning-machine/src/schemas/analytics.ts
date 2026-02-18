import { z } from "zod";

export const AnalyticsOutputSchema = z.object({
  eventTaxonomy: z.object({
    events: z.array(z.object({
      name: z.string(),
      category: z.enum(["lifecycle", "engagement", "conversion", "error"]).optional(),
      properties: z.record(z.string()).optional(),
      trigger: z.string().optional(),
      implementationHint: z.string().optional(),
    })),
  }),
  conversionFunnels: z.array(z.object({
    name: z.string(),
    stages: z.array(z.string()),
    expectedDropoff: z.record(z.string()).optional(),
  })).optional(),
  dashboardSpec: z.object({
    charts: z.array(z.object({
      title: z.string(),
      metric: z.string(),
      visualizationType: z.string().optional(),
      timeRange: z.string().optional(),
    })).optional(),
    alerts: z.array(z.object({
      condition: z.string(),
      notification: z.string().optional(),
    })).optional(),
  }).optional(),
  abTestPlan: z.array(z.object({
    test: z.string(),
    variants: z.array(z.string()),
    metric: z.string(),
    minimumSampleSize: z.number().optional(),
    duration: z.string().optional(),
  })).optional(),
  queueMessageSchemas: z.object({
    foundationNotifications: z.string().optional(),
    foundationWebhooks: z.string().optional(),
    foundationAnalytics: z.string().optional(),
  }).optional(),
  analyticsEngineQueries: z.array(z.object({
    name: z.string(),
    sql: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

export type AnalyticsOutput = z.infer<typeof AnalyticsOutputSchema>;

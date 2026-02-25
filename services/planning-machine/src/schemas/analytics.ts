import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

// ============================================================================
// ERROR TAXONOMY SCHEMA (Phase 3: Resilience)
// Defines retry, escalate, and fail logic for deterministic error handling
// ============================================================================

export const ErrorConditionSchema = z.object({
  code: z.string(),              // e.g., "RATE_LIMIT_EXCEEDED"
  category: z.enum(["transient", "permanent", "security", "logical"]),
  retryStrategy: z.object({
    shouldRetry: z.boolean(),
    maxRetries: z.number().optional(),
    backoff: z.enum(["linear", "exponential", "none"]).default("exponential"),
    initialDelay: z.string().optional(), // e.g., "1s"
  }),
  escalation: z.object({
    shouldEscalate: z.boolean(),
    target: z.enum(["supervisor", "human", "dead-letter-queue", "none"]),
    notificationRequired: z.boolean().default(false),
  }),
  userMessage: z.string(),       // Deterministic UI message
});

export const ErrorTaxonomySchema = z.object({
  globalErrors: z.array(ErrorConditionSchema).default([]),
  componentSpecificErrors: z.record(z.string(), z.array(ErrorConditionSchema)).default({}),
  failureModes: z.array(z.object({
    component: z.string(),
    scenario: z.string(),
    mitigation: z.string(),
  })).default([]),
});

export const AnalyticsOutputSchema = z.object({
  eventTaxonomy: anyField,
  conversionFunnels: anyArray,
  dashboardSpec: anyField,
  abTestPlan: anyArray,
  queueMessageSchemas: anyField,
  analyticsEngineQueries: anyArray,
  
  // NEW: Error Taxonomy (Phase 3)
  errorTaxonomy: ErrorTaxonomySchema.optional(),

  /**
   * Draft tasks contributed by analytics toward final TASKS.json.
   * Include: Analytics Engine setup, event tracking implementation, dashboard tasks.
   */
  draftTasks: anyArray,
}).passthrough();

export type AnalyticsOutput = z.infer<typeof AnalyticsOutputSchema>;

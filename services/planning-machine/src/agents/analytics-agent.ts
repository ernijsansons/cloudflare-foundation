/**
 * Phase 11: Analytics and Tracking Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { AnalyticsOutputSchema, type AnalyticsOutput } from "../schemas/analytics";
import { extractJSON } from "../lib/json-extractor";

interface AnalyticsInput {
  idea: string;
  refinedIdea?: string;
}

export class AnalyticsAgent extends BaseAgent<AnalyticsInput, AnalyticsOutput> {
  config = {
    phase: "analytics",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Is every user action tracked?",
      "Are conversion funnels actionable?",
      "No PII in event properties?",
    ],
    maxTokens: 4096,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at product analytics. Produce event taxonomy for foundation POST /api/analytics/event (blobs, doubles, indexes). Define conversion funnels, dashboard spec, A/B test plan, queue message schemas for audit/notifications/analytics/webhooks. No PII in events. Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      eventTaxonomy: { events: [{ name: "string", category: "lifecycle|engagement|conversion|error", properties: {}, trigger: "string", implementationHint: "string" }] },
      conversionFunnels: [{ name: "string", stages: ["string"], expectedDropoff: {} }],
      dashboardSpec: { charts: [{ title: "string", metric: "string", visualizationType: "string", timeRange: "string" }], alerts: [{ condition: "string", notification: "string" }] },
      abTestPlan: [{ test: "string", variants: ["string"], metric: "string", minimumSampleSize: "number", duration: "string" }],
      queueMessageSchemas: { foundationNotifications: "string", foundationWebhooks: "string", foundationAnalytics: "string" },
      analyticsEngineQueries: [{ name: "string", sql: "string", description: "string" }],
    };
  }

  async run(ctx: AgentContext, input: AnalyticsInput): Promise<AgentResult<AnalyticsOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce analytics and tracking. Merge Phase 8 analyticsEventTaxonomy. Foundation has POST /api/analytics/event with blobs, doubles, indexes. Queues: foundation-audit, foundation-notifications, foundation-analytics, foundation-webhooks.\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.3, maxTokens: this.config.maxTokens ?? 4096 });
      const parsed = extractJSON(response);
      const output = AnalyticsOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("AnalyticsAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

/**
 * Phase 12: Launch Execution Plan Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { LaunchExecutionOutputSchema, type LaunchExecutionOutput } from "../schemas/launch-execution";
import { extractJSON } from "../lib/json-extractor";

interface LaunchExecutionInput {
  idea: string;
  refinedIdea?: string;
}

export class LaunchExecutionAgent extends BaseAgent<LaunchExecutionInput, LaunchExecutionOutput> {
  config = {
    phase: "launch-execution",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "What do I do on Monday?",
      "Are the tools all free or cheap?",
      "What is the north star metric?",
    ],
    maxTokens: 8192,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at bootstrap launch execution.

OUTPUT REQUIREMENTS:
- ninetyDayPlan.weeks: Exactly 12 weeks (not 4). Each week MUST have:
  - theme: One-line focus (e.g., "Build core API", "Launch to first 10 users")
  - dailyActions: 5 specific tasks (Mon-Fri) - ACTIONABLE tasks, not vague goals
  - kpis: 2-3 measurable targets (e.g., "Ship 3 API endpoints", "Get 5 signups")
  - budget: "$0" or specific spend with breakdown
  - toolsNeeded: Tool names with URLs

- metricsFramework:
  - northStarMetric: ONE metric with target number (e.g., "Weekly Active Users > 50 by week 8")
  - weeklyMetrics: 3-5 metrics to track weekly
  - leadIndicators: Early signals before north star moves
  - pivotTriggers: Specific conditions (e.g., "If <10 signups by week 4, pivot to B2B")

- toolStack: Every tool MUST have:
  - function: What it's used for
  - tool: Tool name
  - cost: "free" or "$X/mo"
  - Prefer free tools: Cloudflare, Cursor, GitHub, Linear, Figma free tier, etc.

- budgetAllocation: Break down by category with specific amounts:
  - infrastructure: $X (should be $0 for bootstrap using Cloudflare free tier)
  - marketing: $X (ads, content, etc.)
  - tools: $X
  - domain: $X
  - Total should be realistic for bootstrap (<$500/mo first 3 months)

- buildSchedule:
  - week1to2: Specific features from product-design phase
  - week3to4: Polish and beta prep
  - week5to8: Launch activities
  - week9to12: Iteration based on feedback

Pull specific features from product-design phase. Pull pricing from business-model phase. Pull channels from gtm-marketing phase.

Produce valid JSON. NO empty arrays. NO "$0" for everything - be specific about where money goes.`;
  }

  getPhaseRubric(): string[] {
    return [
      "daily_actions_specific — each week has 5+ actionable tasks",
      "budget_realistic — $0 weeks justified, paid weeks itemized",
      "metrics_measurable — exact numbers for north star and weekly KPIs",
      "tools_linked — each tool has function, name, and cost",
    ];
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      ninetyDayPlan: { weeks: [{ theme: "string", dailyActions: ["string"], kpis: ["string"], budget: "string", toolsNeeded: ["string"] }] },
      metricsFramework: { northStarMetric: "string", weeklyMetrics: ["string"], leadIndicators: ["string"], pivotTriggers: ["string"] },
      toolStack: [{ function: "string", tool: "string", cost: "string" }],
      budgetAllocation: {},
      buildSchedule: { week1to2: "string", week3to4: "string", week5to8: "string", week9to12: "string" },
    };
  }

  async run(ctx: AgentContext, input: LaunchExecutionInput): Promise<AgentResult<LaunchExecutionOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce launch execution plan from ALL prior phases. Week 1-2: build. Week 3-4: polish. Week 5-8: launch. Week 9-12: iterate.\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: this.config.maxTokens ?? 6144 });
      const parsed = extractJSON(response);
      const output = LaunchExecutionOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("LaunchExecutionAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

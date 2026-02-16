/**
 * Phase 12: Launch Execution Plan Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { LaunchExecutionOutputSchema, type LaunchExecutionOutput } from "../schemas/launch-execution";

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
    maxTokens: 6144,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at bootstrap launch execution. Produce 90-day day-by-day plan, metrics framework, tool stack, budget allocation. Pull from ALL prior phases. Most weeks: $0 budget. Produce valid JSON matching the schema.`;
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
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      const output = LaunchExecutionOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("LaunchExecutionAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

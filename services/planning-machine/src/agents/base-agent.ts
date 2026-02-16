/**
 * Base agent interface — all phase agents implement this
 * Uses the 5-phase reasoning protocol
 */

import type { Env } from "../types";
import type { ReasoningState } from "../lib/reasoning-engine";
import { getFoundationContext } from "../lib/foundation-context";

export interface AgentContext {
  runId: string;
  idea: string;
  refinedIdea?: string;
  priorOutputs: Record<string, unknown>;
  ragContext?: string;
  reviewerFeedback?: string; // Feedback from reviewer for revision loop
}

export interface AgentResult<T = unknown> {
  success: boolean;
  output?: T;
  reasoningState?: ReasoningState;
  score?: number;
  errors?: string[];
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface BaseAgentConfig {
  phase: string;
  maxSelfIterations: number;
  qualityThreshold: number;
  hardQuestions: string[];
  maxTokens?: number;
  searchDepth?: "basic" | "advanced";
  includeFoundationContext?: boolean;
}

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  abstract config: BaseAgentConfig;

  constructor(protected env: Env) {}

  abstract getSystemPrompt(): string;

  abstract getOutputSchema(): Record<string, unknown>;

  abstract run(ctx: AgentContext, input: TInput): Promise<AgentResult<TOutput>>;

  getSearchQueries(_idea: string, _ctx: AgentContext): string[] {
    return [];
  }

  getPhaseRubric(): string[] {
    return [];
  }

  protected getHardQuestionsPrompt(): string {
    return this.config.hardQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
  }

  protected buildSystemPrompt(): string {
    const parts: string[] = [this.getSystemPrompt()];
    if (this.config.includeFoundationContext !== false) {
      parts.push(getFoundationContext());
    }
    const rubric = this.getPhaseRubric();
    if (rubric.length > 0) {
      parts.push(
        "\nPhase-specific rubric dimensions (score 0-10 each):\n" +
          rubric.map((r) => `- ${r}`).join("\n")
      );
    }
    return parts.join("\n");
  }

  protected buildContextPrompt(ctx: AgentContext): string {
    const parts: string[] = [
      `Idea: ${ctx.idea}`,
      ctx.refinedIdea ? `Refined opportunity: ${ctx.refinedIdea}` : "",
      "Prior phase outputs:",
      JSON.stringify(ctx.priorOutputs, null, 2),
    ];
    if (ctx.ragContext) {
      parts.push("Relevant context from prior phases:\n" + ctx.ragContext);
    }
    // Include reviewer feedback for revision loop
    if (ctx.reviewerFeedback) {
      parts.push(
        "\n=== REVISION REQUIRED ===\n" +
          "The previous output was reviewed and needs improvement. " +
          "Address the following feedback:\n" +
          ctx.reviewerFeedback +
          "\n=== END FEEDBACK ==="
      );
    }
    return parts.filter(Boolean).join("\n");
  }
}

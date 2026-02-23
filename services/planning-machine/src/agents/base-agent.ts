/**
 * Base agent interface — all phase agents implement this
 * Uses the 5-phase reasoning protocol
 */

import type { Env } from "../types";
import type { ReasoningState } from "../lib/reasoning-engine";
import { getFoundationContext } from "../lib/foundation-context";
import type { OrchestrationResult, OrchestratorConfig } from "../lib/orchestrator";
import { orchestrateModels } from "../lib/orchestrator";
import { validatePhaseOutput, type ValidationResult } from "../lib/schema-validator";
import type { PhaseName } from "@foundation/shared/ontology";

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
  /** Present when multi-model orchestration was used — contains per-model outputs and wild ideas */
  orchestration?: OrchestrationResult;
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

  /**
   * Return true to indicate this agent supports multi-model orchestration.
   * Subclasses that opt in should check this and call orchestrateModels() in run().
   */
  useOrchestration(): boolean {
    return false;
  }

  /**
   * Phase-specific orchestration config. Override to tune model mix, temperatures,
   * or synthesizer for this phase (e.g., kill-test with higher synthesizer weight).
   * Merged with any config passed to orchestrateModels().
   */
  getOrchestratorConfig(): Partial<OrchestratorConfig> | null {
    return null;
  }

  /**
   * Run parallel inference across all configured models, extract wild ideas,
   * then synthesize. Use this inside a subclass's run() after building the
   * prompt — in place of runModel().
   */
  protected async orchestrateModels(
    systemPrompt: string,
    userPrompt: string,
    config?: Partial<OrchestratorConfig>
  ): Promise<OrchestrationResult> {
    const phaseConfig = this.getOrchestratorConfig();
    const mergedConfig =
      phaseConfig || config
        ? { ...phaseConfig, ...config }
        : undefined;
    return orchestrateModels(this.env, systemPrompt, userPrompt, mergedConfig);
  }

  /**
   * Validate phase output against centralized schema registry.
   *
   * Call this after agent-specific parsing to ensure output meets
   * quality standards before persisting to artifacts table.
   *
   * @param output The parsed output from the agent
   * @returns ValidationResult with valid flag and errors if invalid
   *
   * @example
   * ```typescript
   * const validation = this.validateOutput(output);
   * if (!validation.valid) {
   *   console.error("Validation failed:", validation.errors);
   *   return { success: false, errors: validation.errors };
   * }
   * return { success: true, output: validation.data as TOutput };
   * ```
   */
  protected validateOutput(output: unknown): ValidationResult {
    const phase = this.config.phase as PhaseName;
    return validatePhaseOutput(phase, output);
  }

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

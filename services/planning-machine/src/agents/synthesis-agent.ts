/**
 * Phase 13: Synthesis and Build Manifest Agent
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { SynthesisOutputSchema, type SynthesisOutput } from "../schemas/synthesis";
import type { Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface SynthesisInput {
  idea: string;
  refinedIdea?: string;
}

export class SynthesisAgent extends BaseAgent<SynthesisInput, SynthesisOutput> {
  config = {
    phase: "synthesis",
    maxSelfIterations: 2,
    qualityThreshold: 7,
    hardQuestions: [
      "Could Claude Code execute this build manifest without asking questions?",
      "Are skill invocation prompts specific and complete?",
      "Is every file needed listed in the manifest?",
    ],
    maxTokens: 8192,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at synthesizing planning outputs into an executable build manifest. Produce executive summary, risk register, build manifest with skill invocations (data-architect, api-craft, frontend-master, auth-fortress, billing-engine, cloudflare-templates, test-mastery), file manifest, deployment steps. The build manifest must be machine-readable so Claude Code can execute it with zero decisions.

CLOUDFLARE-NATIVE: All technical decisions must be Cloudflare-native and cost-conscious. Reference Phase 10 technicalDecisions. Map components: MapLibre only, never Google Maps.

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      executiveSummary: "string",
      oneLinePitch: "string",
      elevatorPitch: "string",
      riskRegister: [{ risk: "string", probability: "string", impact: "string", mitigation: "string" }],
      keyAssumptions: [{ assumption: "string", howToValidate: "string" }],
      confidenceScore: { overall: "number", breakdown: {} },
      buildManifest: {
        skillInvocations: [{ skill: "string", order: "number", prompt: "string", inputArtifacts: ["string"], expectedOutput: "string", acceptanceCriteria: ["string"] }],
        fileManifest: [{ path: "string", action: "create|modify|delete", description: "string", sourcePhase: "string" }],
        deploymentSteps: ["string"],
        secretsToSet: ["string"],
        postDeployChecks: ["string"],
      },
      nextSteps: ["string"],
    };
  }

  getPhaseRubric(): string[] {
    return [
      "manifest_executability — could Claude Code execute this without asking questions?",
      "skill_prompt_quality — are the skill invocation prompts specific and complete?",
      "file_coverage — is every file needed listed in the manifest?",
      "zero_decisions — are there any remaining decisions for the builder?",
    ];
  }

  async run(ctx: AgentContext, input: SynthesisInput): Promise<AgentResult<SynthesisOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Synthesize ALL prior phases into a build manifest. Phase 10 has tech arch and technicalDecisions. Phase 13 build manifest must reference those files. All technical decisions must be Cloudflare-native and cost-conscious. Map components: MapLibre only. Skill order: data-architect (schema) -> api-craft (routes) -> frontend-master (UI) -> auth-fortress (auth) -> billing-engine (Stripe) -> cloudflare-templates (deploy) -> test-mastery (tests).\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.3, maxTokens: this.config.maxTokens ?? 8192 });
      const parsed = extractJSON(response);
      const output = SynthesisOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("SynthesisAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

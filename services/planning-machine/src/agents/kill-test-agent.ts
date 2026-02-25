/**
 * Phase 4: Kill Test Agent
 *
 * Supports multi-model orchestration: when ORCHESTRATION_ENABLED=true, parallel
 * models assess viability independently, then a synthesizer reconciles. Uses
 * lower temperatureSynthesizer for conservative GO/KILL decisions.
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import type { OrchestrationResult } from "../lib/orchestrator";
import { KillTestOutputSchema, type KillTestOutput } from "../schemas/kill-test";
import { webSearch } from "../tools/web-search";
import type { Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface KillTestInput {
  idea: string;
  refinedIdea?: string;
}

export class KillTestAgent extends BaseAgent<KillTestInput, KillTestOutput> {
  config = {
    phase: "kill-test",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Can you get 10 paying customers in 30 days with $0 ad spend? How specifically?",
      "What is the #1 reason this fails? Be honest.",
      "Is there a 'hair on fire' problem here, or is this a vitamin?",
      "What would have to be true for this to work that you cannot verify today?",
      "Can this run on Cloudflare free tier for the first 1000 users?",
      "Is this a traditional SaaS or a data-driven agentic application? If traditional SaaS, that's a PIVOT signal.",
      "Does this product get smarter with more usage? If not, where's the moat?",
    ],
    maxTokens: 2048,
    searchDepth: "basic" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at brutally honest startup viability assessment. Your job is to produce a GO/PIVOT/KILL verdict with evidence.

Consider: bootstrap feasibility, time to MVP, time to first revenue, free distribution channels, Cloudflare free tier sufficiency, fatal flaws.

AGENTIC ASSESSMENT (REQUIRED): Include agenticAssessment: { isAgentic, agenticDepth: "deep"|"surface"|"none", whatMakesItAgentic, dataCompoundingMechanism }. Traditional SaaS (CRUD dashboards, manual workflows) is a PIVOT signal. Data-driven agentic applications (agents act on data autonomously, product gets smarter with usage) get GO. If agenticDepth is "none", consider PIVOT.

PARKED FOR FUTURE: When verdict is KILL because the idea is too expensive or AI tooling is not ready yet, but it could be excellent in 6-18 months as AI innovates, set parkedForFuture: { reason, revisitEstimateMonths } (6-24). This saves the idea for the Future Ideas Bucket dashboard.

Every claim must cite a source. If you cannot find evidence, say UNKNOWN.

Produce valid JSON matching the schema. verdict must be one of: GO, PIVOT, KILL.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      verdict: "GO|PIVOT|KILL",
      agenticAssessment: { isAgentic: "boolean", agenticDepth: "deep|surface|none", whatMakesItAgentic: "string", dataCompoundingMechanism: "string" },
      bootstrapFeasibility: {
        canOneSoloFounderBuild: "boolean",
        canOneSoloFounderBuildReasoning: "string",
        timeToMVP: "string",
        timeToMVPWeeks: "number",
        canReachFirst100CustomersForFree: "boolean",
        canReachFirst100CustomersForFreeChannels: ["string"],
        hasFreeDist: "boolean",
        timeToFirstRevenue: "string",
        timeToFirstRevenueWeeks: "number",
        cloudflareFreeTierSufficient: "boolean",
        cloudflareFreeTierReasoning: "string",
      },
      fatalFlaws: ["string"],
      parkedForFuture: { reason: "string", revisitEstimateMonths: "number 6-24", note: "string" },
      pivotSuggestions: ["string"],
      unfairAdvantagesNeeded: ["string"],
      riskRegister: [{ risk: "string", probability: "string", impact: "string", mitigation: "string" }],
    };
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} bootstrapped success`,
      `${idea} first customers without ads`,
      `${idea} failed startup`,
      `${idea} "hair on fire" problem`,
      `bootstrapped saas first 100 customers`,
      `Cloudflare Workers free tier limits`,
    ];
  }

  override useOrchestration(): boolean {
    return true;
  }

  override getOrchestratorConfig() {
    return {
      temperatureSynthesizer: 0.1,
    };
  }

  async run(
    ctx: AgentContext,
    input: KillTestInput
  ): Promise<AgentResult<KillTestOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const searchQueries = this.getSearchQueries(idea);

    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of searchQueries) {
      const results = await webSearch(q, this.env, { maxResults: 5, deduplicate: true });
      searchResults.push({ query: q, results });
    }

    const context = [
      this.buildContextPrompt(ctx),
      "Search results:",
      JSON.stringify(
        searchResults.map((s) => ({
          query: s.query,
          snippets: s.results.slice(0, 3).map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content?.slice(0, 250),
          })),
        })),
        null,
        2
      ),
    ].join("\n\n");

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = `Assess this idea with the kill test. Use prior phase outputs and search results.\n\n${context}\n\nOutput valid JSON matching the schema. verdict must be GO, PIVOT, or KILL.`;

    if (this.env.ORCHESTRATION_ENABLED === "true") {
      return this.runWithOrchestration(systemPrompt, userPrompt);
    }

    return this.runSingleModel(systemPrompt, userPrompt);
  }

  private async runWithOrchestration(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AgentResult<KillTestOutput>> {
    let orchResult: OrchestrationResult;
    try {
      orchResult = await this.orchestrateModels(systemPrompt, userPrompt);
    } catch (e) {
      console.error("[KillTestAgent] Orchestration failed, falling back to single model:", e);
      return this.runSingleModel(systemPrompt, userPrompt);
    }

    try {
      const parsed = extractJSON(orchResult.finalText);
      const output = KillTestOutputSchema.parse(parsed);
      return { success: true, output, orchestration: orchResult };
    } catch (e) {
      console.error("[KillTestAgent] Failed to parse orchestration output:", e);
      return this.runSingleModel(systemPrompt, userPrompt);
    }
  }

  private async runSingleModel(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AgentResult<KillTestOutput>> {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.3,
        maxTokens: this.config.maxTokens ?? 2048,
      });

      const parsed = extractJSON(response);
      const output = KillTestOutputSchema.parse(parsed);

      return { success: true, output };
    } catch (e) {
      console.error("KillTestAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }
}

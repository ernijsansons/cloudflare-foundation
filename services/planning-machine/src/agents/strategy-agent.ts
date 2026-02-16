/**
 * Phase 5: Bootstrap Strategy and Positioning Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { StrategyOutputSchema, type StrategyOutput } from "../schemas/strategy";

interface StrategyInput {
  idea: string;
  refinedIdea?: string;
}

export class StrategyAgent extends BaseAgent<StrategyInput, StrategyOutput> {
  config = {
    phase: "strategy",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Would the target customer recognize themselves in the positioning?",
      "Is the wedge small enough to ship in 4 weeks?",
      "What would make an incumbent ignore this for 2 years?",
    ],
    maxTokens: 4096,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at startup positioning and strategy. Produce positioning statement, brand voice, wedge strategy, differentiation axes. Format: For [target], who [situation], [product] is a [category] that [key benefit] unlike [alternative] which [competitor weakness].

AGENTIC MANDATE: Position as a data-driven agentic application, NOT traditional SaaS. Include in strategicNarrative:
- agenticVision: How the product evolves from tool to autonomous agent
- dataFlywheel: What data compounds and how it creates moat (more usage = smarter agents)

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      positioning: { for: "string", who: "string", product: "string", category: "string", keyBenefit: "string", unlike: "string", competitorWeakness: "string" },
      strategicNarrative: { whatIsChanging: "string", whyInevitable: "string", agenticVision: "string", dataFlywheel: "string" },
      brandVoice: { tone: "string", personality: "string", wordsToUse: ["string"], wordsToNeverUse: ["string"] },
      wedgeStrategy: { smallestProduct: "string", fullValueTo: "string", reasoning: "string" },
      differentiationAxes: ["string"],
      moatStrategy: { howGetsHarder: "string", timeline: "string" },
      nameSuggestions: [{ name: "string", domainCheckQuery: "string" }],
    };
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} positioning strategy`,
      `${idea} brand voice tone`,
      `${idea} wedge strategy startup`,
      `${idea} differentiation competitors`,
      `${idea} moat defensibility`,
      `${idea} agentic AI application positioning`,
      `data flywheel AI product moat`,
    ];
  }

  async run(ctx: AgentContext, input: StrategyInput): Promise<AgentResult<StrategyOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const queries = this.getSearchQueries(idea);
    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of queries) {
      searchResults.push({ query: q, results: await webSearch(q, this.env, { maxResults: 5, deduplicate: true }) });
    }

    const context = [
      this.buildContextPrompt(ctx),
      "Search results:",
      JSON.stringify(searchResults.map((s) => ({ query: s.query, snippets: s.results.slice(0, 3).map((r) => ({ title: r.title, content: r.content?.slice(0, 200) })) })), null, 2),
    ].join("\n\n");

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce strategy and positioning.\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: 4096 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      const output = StrategyOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("StrategyAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

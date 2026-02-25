/**
 * Phase 2: Market and Pricing Intelligence Agent
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { MarketResearchOutputSchema, type MarketResearchOutput } from "../schemas/market-research";
import { webSearch } from "../tools/web-search";
import type { Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface MarketResearchInput {
  idea: string;
  refinedIdea?: string;
}

export class MarketResearchAgent extends BaseAgent<MarketResearchInput, MarketResearchOutput> {
  config = {
    phase: "market-research",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Is the TAM/SAM/SOM backed by credible sources?",
      "Does the pricing psychology align with competitor behavior?",
      "What regulatory changes could kill this market?",
    ],
    maxTokens: 4096,
    searchDepth: "basic" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at market sizing and pricing strategy.

EVIDENCE REQUIREMENTS:
- TAM/SAM/SOM: Each MUST include a source URL. If you cannot find a credible source, state "NO SOURCE FOUND" and estimate with reasoning.
- pricingLandscape: MUST include at least 3 competitors from search results. For each: exact pricing page URL, all tiers with prices.
- pricingPsychology: MUST recommend specific dollar amounts, not ranges. Include: recommended price point, anchoring strategy, decoy tier.
- marketRisks: MUST list at least 3 concrete risks with likelihood (high/medium/low) and potential impact.
- priceRanges: MUST include specific dollar amounts for min/max/recommended, not "varies" or "TBD".

DO NOT mark fields as UNKNOWN if search results contain relevant data. Extract and cite.
DO NOT return empty arrays or objects. Every field must have substantive content.

Produce valid JSON matching the schema.`;
  }

  getPhaseRubric(): string[] {
    return [
      "tam_sam_som_sourced — every number has a URL citation",
      "pricing_landscape_complete — at least 3 competitors with actual tier/price data",
      "pricing_psychology_actionable — specific strategy with $ recommendations",
      "risks_enumerated — at least 3 concrete risks with likelihood/impact",
    ];
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      marketSize: { tam: "string", tamSource: "string", tamConfidence: "high|medium|low", sam: "string", som: "string" },
      growthRate: "string",
      growthRateSource: "string",
      marketTiming: { whyNow: "string", whatChanged: "string", tailwinds: ["string"], headwinds: ["string"] },
      pricingLandscape: [{ competitor: "string", tiers: [{ name: "string", price: "string", features: ["string"] }], url: "string" }],
      pricingPsychology: { strategy: "string", reasoning: "string", anchoring: "string", decoy: "string", freemiumVsTrial: "string", annualVsMonthly: "string" },
      priceRanges: { min: "number", max: "number", recommended: "string", evidence: "string" },
      regulatoryFactors: ["string"],
      marketRisks: ["string"],
    };
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} market size TAM SAM SOM 2024 2025`,
      `${idea} market growth rate forecast`,
      `${idea} competitor pricing page`,
      `"${idea}" pricing tiers plans`,
      `${idea} industry report market research`,
      `${idea} regulatory risk compliance`,
      `${idea} pricing psychology strategy SaaS`,
      `"${idea}" site:statista.com OR site:grandviewresearch.com`,
      `${idea} "why now" market timing`,
    ];
  }

  async run(
    ctx: AgentContext,
    input: MarketResearchInput
  ): Promise<AgentResult<MarketResearchOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const searchQueries = this.getSearchQueries(idea);

    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of searchQueries) {
      const results = await webSearch(q, this.env, { maxResults: 6, deduplicate: true });
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
            content: r.content?.slice(0, 500),
          })),
        })),
        null,
        2
      ),
    ].join("\n\n");

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      {
        role: "user" as const,
        content: `Analyze this idea and produce market and pricing intelligence. Use ONLY the search results as evidence.\n\n${context}\n\nOutput valid JSON matching the schema.`,
      },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.5,
        maxTokens: this.config.maxTokens ?? 4096,
      });

      const parsed = extractJSON(response);
      const output = MarketResearchOutputSchema.parse(parsed);

      return {
        success: true,
        output,
      };
    } catch (e) {
      console.error("MarketResearchAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }
}

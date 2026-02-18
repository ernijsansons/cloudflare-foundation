/**
 * Phase 2: Market and Pricing Intelligence Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { MarketResearchOutputSchema, type MarketResearchOutput } from "../schemas/market-research";

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
    return `You are an expert at market sizing and pricing strategy. Your job is to produce TAM/SAM/SOM with sources, competitor pricing landscape, and pricing psychology recommendations.

Every claim must cite a source. If you cannot find evidence, say UNKNOWN.

Produce valid JSON matching the schema.`;
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
      `${idea} market size TAM SAM SOM`,
      `${idea} market growth rate 2025 2026`,
      `${idea} competitors pricing`,
      `${idea} "why now" market timing`,
      `${idea} pricing strategy SaaS`,
      `${idea} regulatory compliance`,
      `${idea} market risks`,
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
            content: r.content?.slice(0, 250),
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

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);
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

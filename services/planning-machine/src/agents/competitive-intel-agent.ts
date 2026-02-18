/**
 * Phase 3: Competitive Intelligence Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { CompetitiveIntelOutputSchema, type CompetitiveIntelOutput } from "../schemas/competitive-intel";

interface CompetitiveIntelInput {
  idea: string;
  refinedIdea?: string;
  competitors?: string[];
}

export class CompetitiveIntelAgent extends BaseAgent<CompetitiveIntelInput, CompetitiveIntelOutput> {
  config = {
    phase: "competitive-intel",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "What do their 1-star reviews say? What pattern emerges?",
      "What keyword do they NOT rank for that has high intent?",
      "What segment do they ignore because it is too small for them but perfect for a bootstrapper?",
    ],
    maxTokens: 4096,
    searchDepth: "advanced" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at competitive analysis. Your job is to produce a teardown of competitors: strengths, weaknesses, messaging analysis, customer complaints from reviews, SEO keywords, and the gaps they leave open.

Every claim must cite a source. If you cannot find evidence, say UNKNOWN.

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      competitors: [{
        name: "string",
        url: "string",
        foundedYear: "number",
        fundingStatus: "string",
        pricing: { tiers: [{ name: "string", price: "string", features: ["string"] }] },
        strengths: ["string"],
        weaknesses: ["string"],
        messagingAnalysis: { headline: "string", valueProp: "string", tone: "string", emotionalAppeals: ["string"] },
        seoKeywords: ["string"],
        customerComplaints: [{ complaint: "string", quote: "string" }],
        techStack: "string",
      }],
      positioningGaps: ["string"],
      messagingGaps: ["string"],
      pricingGaps: ["string"],
      vulnerabilities: ["string"],
    };
  }

  getSearchQueries(idea: string, ctx: AgentContext): string[] {
    const prior = ctx.priorOutputs;
    const opp = prior.opportunity as { refinedOpportunities?: Array<{ idea: string }> } | undefined;
    const market = prior["market-research"] as { pricingLandscape?: Array<{ competitor: string }> } | undefined;
    const competitorNames = market?.pricingLandscape?.map((p) => p.competitor) ??
      opp?.refinedOpportunities?.slice(0, 3).map((o) => o.idea) ?? [idea];

    const base = [
      `${idea} competitors`,
      `${idea} alternative`,
      `${idea} vs comparison`,
      `site:g2.com "${idea}"`,
      `site:capterra.com "${idea}"`,
    ];

    const perCompetitor = competitorNames.slice(0, 3).flatMap((c) => [
      `"${c}" review`,
      `"${c}" alternative`,
      `"${c}" 1 star reviews`,
    ]);

    return [...base, ...perCompetitor];
  }

  async run(
    ctx: AgentContext,
    input: CompetitiveIntelInput
  ): Promise<AgentResult<CompetitiveIntelOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const searchQueries = this.getSearchQueries(idea, ctx);

    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of searchQueries) {
      const results = await webSearch(q, this.env, {
        maxResults: 6,
        searchDepth: this.config.searchDepth,
        deduplicate: true,
      });
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
        content: `Analyze this idea and produce competitive intelligence. Use ONLY the search results as evidence.\n\n${context}\n\nOutput valid JSON matching the schema.`,
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
      const output = CompetitiveIntelOutputSchema.parse(parsed);

      return {
        success: true,
        output,
      };
    } catch (e) {
      console.error("CompetitiveIntelAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }
}

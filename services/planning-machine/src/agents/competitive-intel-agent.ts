/**
 * Phase 3: Competitive Intelligence Agent
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { CompetitiveIntelOutputSchema, type CompetitiveIntelOutput } from "../schemas/competitive-intel";
import { webSearch } from "../tools/web-search";
import type { Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

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
    return `You are an expert at competitive analysis. Produce a detailed teardown.

MANDATORY OUTPUT REQUIREMENTS:
- competitors array: MINIMUM 3 entries. For each competitor:
  - name + url (from search results)
  - foundedYear: Extract from About pages or Crunchbase
  - fundingStatus: bootstrapped, seed, series A/B/C, public
  - pricing.tiers: Extract actual tiers/prices from their pricing pages
  - strengths: At least 3 per competitor
  - weaknesses: At least 3 per competitor
  - messagingAnalysis: Headline from their homepage, value prop, tone
  - customerComplaints: At least 2 actual quotes from G2/Capterra/Reddit reviews with source
  - seoKeywords: 5+ keywords they rank for

- positioningGaps: At least 3 gaps. Format: "[Competitor] focuses on [X], leaving [Y] segment underserved"
- messagingGaps: What messaging angles competitors miss
- pricingGaps: Price points competitors avoid (e.g., "No competitor offers <$20/mo tier")
- vulnerabilities: Specific exploitable weaknesses (e.g., "Competitor X has 2.3★ on mobile app")

Extract data from search results. DO NOT return empty arrays.
If you cannot find info for a field, explain what you searched and why it wasn't found.

Produce valid JSON matching the schema.`;
  }

  getPhaseRubric(): string[] {
    return [
      "competitors_identified — at least 3 competitors with URLs and founding info",
      "review_quotes — actual 1-star quotes with sources",
      "gaps_specific — actionable positioning/messaging/pricing gaps",
      "vulnerability_exploitation — how to exploit each weakness",
    ];
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

    const perCompetitor = competitorNames.slice(0, 5).flatMap((c) => [
      `"${c}" site:g2.com reviews`,
      `"${c}" site:capterra.com reviews`,
      `"${c}" site:trustpilot.com`,
      `"${c}" pricing tiers plans`,
      `"${c}" complaints OR frustrating OR hate`,
      `"${c}" alternative comparison`,
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
        content: `Analyze this idea and produce competitive intelligence. Use ONLY the search results as evidence.\n\n${context}\n\nOutput valid JSON matching the schema.`,
      },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.5,
        maxTokens: this.config.maxTokens ?? 4096,
      });

      const parsed = extractJSON(response);
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

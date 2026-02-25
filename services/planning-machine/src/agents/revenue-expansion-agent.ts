/**
 * Phase 4.5: Revenue Expansion Intelligence Agent
 * Runs after kill-test GO. Discovers adjacent products, upsell features, and maps revenue ecosystem.
 * Studies Palantir and AI companies for agentic monetization patterns.
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { RevenueExpansionOutputSchema, type RevenueExpansionOutput } from "../schemas/revenue-expansion";
import { webSearch } from "../tools/web-search";
import type { Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface RevenueExpansionInput {
  idea: string;
  refinedIdea?: string;
}

export class RevenueExpansionAgent extends BaseAgent<RevenueExpansionInput, RevenueExpansionOutput> {
  config = {
    phase: "revenue-expansion",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "We know the target market. What ELSE do they already pay for that we can absorb or replace?",
      "If we're extremely good at one thing (e.g. lead sourcing), what adjacent feature would everyone highly utilize? (e.g. automated outreach)",
      "What would the apartments.com/homes.com play look like for this market?",
      "How does Palantir expand from one use case into an ecosystem?",
    ],
    maxTokens: 6144,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at revenue expansion and ecosystem strategy. Your job is to produce a revenue ecosystem map for a validated product idea.

CORE PRINCIPLE: We know our target market. What else can we do to fully take advantage of this?

1. ADJACENT PRODUCTS: Completely different businesses serving the same buyer (like apartments.com adjacent to homes.com, or mortgages/insurance for property seekers). What else does our target audience pay for?

2. UPSELL FEATURES: Features to add within the same product that maximize revenue. Example: if we're extremely good at lead sourcing, adding automated outreach is extra value everyone will highly utilize. What features would our users pay premium for?

3. AGENTIC VALUE CHAIN: How does data flow between products/features to create compounding agentic value? More usage = smarter agents = more value.

4. PALANTIR LESSONS: Study Palantir, Scale AI, Databricks, Anduril. How do they monetize data + agents? What applies to our market?

5. REVENUE RANKING: Rank ALL opportunities (primary + adjacent + upsell) by: (1) revenue potential, (2) speed to revenue, (3) agentic depth. Making money is #1 priority.

Every claim must cite a source. If you cannot find evidence, say UNKNOWN.
Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      primaryProduct: "string",
      adjacentProducts: [{ product: "string", description: "string", revenueCeiling: "VERY_HIGH|HIGH|MEDIUM|LOW", implementationEffort: "LOW|MEDIUM|HIGH", audienceOverlap: "number 0-1", agenticPotential: "HIGH|MEDIUM|LOW", reasoning: "string" }],
      upsellFeatures: [{ feature: "string", description: "string", willingnessToPayEvidence: "string", revenueImpact: "HIGH|MEDIUM|LOW", effortToAdd: "LOW|MEDIUM|HIGH", agenticValue: "string" }],
      ecosystemStrategy: "string",
      agenticValueChain: "string",
      palantirLessons: ["string"],
      revenueRanking: [{ id: "string", type: "primary|adjacent|upsell", name: "string", revenuePotential: "number", speedToRevenue: "FAST|MEDIUM|SLOW", agenticDepth: "deep|surface|none", rank: "number" }],
    };
  }

  getSearchQueries(idea: string, ctx: AgentContext): string[] {
    const prior = ctx.priorOutputs;
    const customerIntel = prior["customer-intel"] as { idealCustomerProfiles?: Array<{ demographics?: { jobTitle?: string; industry?: string } }> } | undefined;
    const targetAudience = customerIntel?.idealCustomerProfiles?.[0]?.demographics?.jobTitle
      ?? customerIntel?.idealCustomerProfiles?.[0]?.demographics?.industry
      ?? idea;

    return [
      `"${targetAudience}" what else they pay for tools services`,
      `"${targetAudience}" adjacent services tools`,
      `${idea} upsell features premium add-on`,
      `Palantir business model platform expansion`,
      `"data-driven" agentic application revenue model`,
      `Scale AI Databricks monetization strategy`,
      `AI companies usage-based pricing`,
      `${idea} ecosystem platform strategy`,
    ];
  }

  getPhaseRubric(): string[] {
    return [
      "adjacent_product_relevance: How well do adjacent products target the same buyer?",
      "upsell_feature_value: Evidence of willingness-to-pay for upsell features",
      "agentic_value_chain_depth: How compelling is the data compounding story?",
      "revenue_ranking_actionability: Can we execute on the ranked opportunities?",
    ];
  }

  async run(ctx: AgentContext, input: RevenueExpansionInput): Promise<AgentResult<RevenueExpansionOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const searchQueries = this.getSearchQueries(idea, ctx);

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
        content: `Produce revenue expansion intelligence. Use prior phases (especially customer-intel, opportunity, market-research, kill-test) and search results.\n\n${context}\n\nOutput valid JSON matching the schema. Include primary product, 3-5 adjacent products, 3-5 upsell features, ecosystem strategy, agentic value chain, palantir lessons, and revenue ranking.`,
      },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.5,
        maxTokens: this.config.maxTokens ?? 6144,
      });

      const parsed = extractJSON(response);
      const output = RevenueExpansionOutputSchema.parse(parsed);

      return {
        success: true,
        output,
      };
    } catch (e) {
      console.error("RevenueExpansionAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }
}

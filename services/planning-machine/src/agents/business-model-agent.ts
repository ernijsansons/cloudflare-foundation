/**
 * Phase 6: Business Model Agent (Bootstrap-optimized, Foundation-aware)
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { BusinessModelOutputSchema, type BusinessModelOutput } from "../schemas/business-model";
import { extractJSON } from "../lib/json-extractor";

interface BusinessModelInput {
  idea: string;
  refinedIdea?: string;
}

export class BusinessModelAgent extends BaseAgent<BusinessModelInput, BusinessModelOutput> {
  config = {
    phase: "business-model",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Can this hit $1K MRR on Cloudflare free tier?",
      "What is the CAC for the first 100 customers?",
      "Does the pricing psychology align with Phase 2 recommendations?",
    ],
    maxTokens: 4096,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at bootstrap SaaS business models.

CONCRETE OUTPUT REQUIREMENTS:
- revenueModel: Pick ONE model (usage-based, outcome-based, tiered). Explain why. Include bootstrapFriendlinessScore (1-10).

- agenticPricingModel: MANDATORY. Prioritize usage-based/outcome-based pricing over seat-based SaaS. Charge for agent-delivered outcomes (leads generated, actions taken, decisions made), not "per user per month" CRUD access.

- pricingTiers: Exactly 3 tiers with SPECIFIC dollar amounts:
  - Free: $0, define exact limits (e.g., "100 API calls/month")
  - Pro: $X/mo - recommend specific price based on market research phase competitors
  - Enterprise: $Y/mo or custom
  - Each tier MUST include: psychologyReasoning, anchoringTrick (why this tier makes Pro look good)

- unitEconomics: Calculate with actual numbers:
  - cac: "Estimated $X based on [channel] at [conversion rate]"
  - ltv: "$Y assuming [churn rate] and [expansion revenue]"
  - ltvCacRatio: Must be >3 for viable business
  - paybackPeriod: Number of months

- bootstrapMilestones: Specific targets:
  - firstDollar: { feature, targetBuyer, timeline }
  - first1KMRR: { customersNeeded, pricePoint, timeline }
  - first10KMRR: { strategy, timeline }
  - ramenProfitable: { monthlyBurn, mrr, timeline }

- costStructure:
  - cloudflareServices: { workers, d1, r2, vectorize } with estimated costs at scale
  - thirdPartyServices: List with costs (Stripe 2.9%, email, etc.)
  - monthlyBurnByStage: { preLaunch, launch, growth }

- stripeConfiguration:
  - products: Array with suggested product names and descriptions
  - checkoutVsEmbedded: Recommendation with reasoning
  - webhookEvents: List of events to handle

Consider Cloudflare free tier: 100K req/day Workers, 5M D1 reads, 10GB R2.

Produce valid JSON. NO empty objects. NO "TBD" values. NO "$X" placeholders - use real numbers.`;
  }

  getPhaseRubric(): string[] {
    return [
      "pricing_tiers_concrete — exact dollar amounts, not ranges or TBD",
      "unit_economics_calculated — CAC/LTV with formulas shown",
      "bootstrap_milestones_specific — customer counts and timelines",
      "stripe_config_complete — actual product names and webhook events",
    ];
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      revenueModel: { type: "string", reasoning: "string", bootstrapFriendlinessScore: "number" },
      agenticPricingModel: { outcomeBasedPricing: "string", usageBasedModel: "string", agentDeliveredValue: "string" },
      expansionRevenue: { adjacentProducts: ["string"], upsellFeatures: ["string"], timeline: "string", revenuePotential: "string" },
      pricingTiers: [{ name: "string", price: "string", features: ["string"], psychologyReasoning: "string", anchoringTrick: "string" }],
      unitEconomics: { cac: "string", ltv: "string", ltvCacRatio: "string", paybackPeriod: "string" },
      bootstrapMilestones: { firstDollar: {}, first1KMRR: {}, first10KMRR: {}, ramenProfitable: {} },
      costStructure: { cloudflareServices: {}, thirdPartyServices: [], monthlyBurnByStage: {} },
      breakEvenTimeline: "string",
      stripeConfiguration: { products: [], checkoutVsEmbedded: "string", webhookEvents: ["string"] },
    };
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} pricing model SaaS`,
      `${idea} unit economics CAC LTV`,
      `Cloudflare Workers pricing free tier`,
      `Stripe pricing SaaS bootstrap`,
      `${idea} break even timeline`,
      `AI agent usage-based pricing`,
      `Palantir pricing model enterprise`,
    ];
  }

  async run(ctx: AgentContext, input: BusinessModelInput): Promise<AgentResult<BusinessModelOutput>> {
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
          snippets: s.results.slice(0, 3).map((r) => ({ title: r.title, content: r.content?.slice(0, 500) })),
        })),
        null,
        2
      ),
    ].join("\n\n");

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce business model. Use prior phases and search results.\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.5,
        maxTokens: this.config.maxTokens ?? 4096,
      });

      const parsed = extractJSON(response);
      const output = BusinessModelOutputSchema.parse(parsed);

      return { success: true, output };
    } catch (e) {
      console.error("BusinessModelAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

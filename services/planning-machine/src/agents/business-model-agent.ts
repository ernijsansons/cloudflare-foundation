/**
 * Phase 6: Business Model Agent (Bootstrap-optimized, Foundation-aware)
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { BusinessModelOutputSchema, type BusinessModelOutput } from "../schemas/business-model";
import { webSearch } from "../tools/web-search";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

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
      "For AI/agentic products: Are AI costs (40-70% of COGS) explicitly modeled with per-token costs?",
      "What is the gross margin by tier after AI/infrastructure costs?",
      "Is there a credit system or hard usage caps to prevent cost explosion?",
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

AI COST MODELING (MANDATORY for AI/agentic products):
Determine: Does this product use AI/ML (LLMs, embeddings, vector search, autonomous agents)? If YES, you MUST specify comprehensive aiCostModeling:

1. MODELS: For each AI model used:
   - provider: workers-ai | anthropic | openai | custom
   - model: specific model name (e.g., "claude-3-5-sonnet-20241022", "llama-3.1-8b-instruct")
   - costPerToken: { input: $X per token, output: $Y per token }
   - projectedMonthlyTokens: { free: X tokens, pro: Y tokens, enterprise: Z tokens }
   - monthlySpend: { free: "$X", pro: "$Y", enterprise: "$Z" }

2. AI GATEWAY CONFIGURATION:
   - enabled: boolean
   - gatewayId: string
   - cacheTTL: seconds (cache TTL for cost savings)
   - keyManagement: cloudflare-secrets | env-vars (PREFER cloudflare-secrets for BYOK pattern)
   - costAttribution: { enabled, granularity: per-tenant | per-user | per-request }

3. VECTORIZE COSTS:
   - dimensions: 384 | 768 | 1536 | 3072
   - indexedVectors: number
   - queriesPerMonth: { free, pro, enterprise }
   - estimatedCost: "$X/month"

4. EDGE COMPUTE COSTS:
   - workersRequests: number/month
   - durableObjectsRequests: number/month
   - d1Reads: number/month, d1Writes: number/month
   - r2Storage: GB
   - totalEstimate: "$X/month"
   - freeAllowanceRemaining: "$X" (how much left after free tier)

5. TOTAL AI COST PER CUSTOMER:
   - free: "$X/month per customer"
   - pro: "$Y/month per customer"
   - enterprise: "$Z/month per customer"

GROSS MARGIN ANALYSIS (MANDATORY for AI products):
- byTier: [{ tier: "free|pro|enterprise", revenue: "$X", cogs: { infrastructure: "$A", aiCosts: "$B", thirdParty: "$C", total: "$D" }, grossMargin: "$E", grossMarginPercent: "F%" }]
- targetGrossMargin: "60%+" (typical SaaS target)
- scalingDynamics: "How margins improve/worsen at scale"

CREDIT SYSTEM DESIGN (RECOMMENDED for AI products):
- applies: boolean
- creditDefinition: "What is 1 credit?" (e.g., "1 credit = 10K tokens")
- creditToPriceRatio: "$X per N credits"
- overage: { enabled, overageRate: "$X per credit", hardCap: "prevent unlimited burn" }
- rollover: boolean (unused credits carry over?)
- expirationPolicy: "30 days | never"

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
      aiCostModeling: {
        "_note": "REQUIRED for AI/agentic products, OMIT for non-AI products",
        applies: "boolean",
        models: [{ provider: "workers-ai|anthropic|openai", model: "string", costPerToken: { input: "number", output: "number" }, projectedMonthlyTokens: { free: "number", pro: "number", enterprise: "number" }, monthlySpend: { free: "string", pro: "string", enterprise: "string" } }],
        aiGatewayConfig: { enabled: "boolean", gatewayId: "string", cacheTTL: "number", keyManagement: "cloudflare-secrets|env-vars", costAttribution: { enabled: "boolean", granularity: "per-tenant|per-user|per-request" } },
        vectorizeCosts: { dimensions: "number", indexedVectors: "number", queriesPerMonth: { free: "number", pro: "number", enterprise: "number" }, estimatedCost: "string" },
        edgeComputeCosts: { workersRequests: "number", durableObjectsRequests: "number", d1Reads: "number", d1Writes: "number", r2Storage: "string", totalEstimate: "string", freeAllowanceRemaining: "string" },
        totalAICostPerCustomer: { free: "string", pro: "string", enterprise: "string" }
      },
      grossMarginAnalysis: {
        "_note": "REQUIRED for AI products to validate unit economics",
        byTier: [{ tier: "free|pro|enterprise", revenue: "string", cogs: { infrastructure: "string", aiCosts: "string", thirdParty: "string", total: "string" }, grossMargin: "string", grossMarginPercent: "string" }],
        targetGrossMargin: "string",
        scalingDynamics: "string"
      },
      creditSystemDesign: {
        "_note": "RECOMMENDED for AI products to manage usage-based costs",
        applies: "boolean",
        creditDefinition: "string",
        creditToPriceRatio: "string",
        overage: { enabled: "boolean", overageRate: "string", hardCap: "string" },
        rollover: "boolean",
        expirationPolicy: "string"
      }
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
      { role: "user" as const, content: `Produce business model. Use prior phases and search results.

CRITICAL: Determine if this product uses AI/ML (LLMs, embeddings, vector search, autonomous agents). If YES, you MUST specify:
- aiCostModeling (with per-model token costs, AI Gateway BYOK, vectorize costs, edge compute costs)
- grossMarginAnalysis (to validate unit economics after AI costs which can be 40-70% of COGS)
- creditSystemDesign (recommended to prevent unlimited cost burn)

Check Phase 9 for isAgenticSoftware flag. If true, AI cost modeling is MANDATORY.

${context}

Output valid JSON matching the schema. Use REAL numbers, not placeholders.` },
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

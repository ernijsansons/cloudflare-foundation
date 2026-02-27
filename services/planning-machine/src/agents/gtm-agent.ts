/**
 * Phase 8: Bootstrap GTM and Growth Engine
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { GTMOutputSchema, type GTMOutput } from "../schemas/gtm";
import { webSearch } from "../tools/web-search";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface GTMInput {
  idea: string;
  refinedIdea?: string;
}

export class GTMAgent extends BaseAgent<GTMInput, GTMOutput> {
  config = {
    phase: "gtm-marketing",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "If you have $0 and 4 hours per day, what are the 3 highest-ROI activities?",
      "Name the SPECIFIC subreddit. Name the SPECIFIC newsletter to pitch.",
      "What is the lead magnet that makes them give their email before they see the product?",
      "For API/developer products: Is API-as-distribution strategy specified (webhooks, embeddable widgets, sandbox)?",
      "For B2B products: Which marketplace makes most sense (Shopify, Salesforce, HubSpot)?",
      "Is there a referral engine with viral coefficient > 1.2?",
    ],
    maxTokens: 6144,
    searchDepth: "advanced" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at bootstrap GTM AND programmatic growth. Produce $0-budget launch bible: SEO strategy, content calendar, launch playbook (Product Hunt, HN, Reddit), email sequences, growth loops, analytics event taxonomy. Use customer language from Phase 1. Name SPECIFIC subreddits, newsletters, communities.

PROGRAMMATIC GROWTH (Phase 2 - beyond organic/paid):

Determine which programmatic channels apply based on product type:

1. API-AS-DISTRIBUTION (for API/developer products):
   - applies: true if product has API, developer audience, or integration possibilities
   - webhookStrategy: How webhooks enable customer workflows
   - embeddableWidgets: [{ widgetType (e.g., "pricing calculator"), targetPlatforms (Webflow, WordPress), implementation }]
   - developerDocs: Quality bar (Stripe-level vs basic)
   - sandboxEnvironment: Test API without signup

2. MARKETPLACE STRATEGY (for B2B SaaS):
   - applies: true if product integrates with platforms customers already use
   - targetMarketplaces: [{ platform (Shopify, Salesforce, HubSpot, Slack, etc.), fit (why good match), timeline }]
   - integrationDepth: shallow-oauth | deep-bi-directional | native-ui

3. REFERRAL ENGINE (for viral products):
   - applies: true if product benefits from word-of-mouth
   - incentiveStructure: { referrerReward ("$20 credit"), refereeReward ("50% off first month"), viralCoefficient ("target 1.5") }
   - mechanics: How referral works (unique link, dashboard, tracking)
   - trackingImplementation: Technical approach
   - bootstrapCost: "$0 if built in-house, $50-200/mo for ReferralCandy"

4. AFFILIATE PROGRAM (for high-ticket products):
   - applies: true if product has high LTV and natural influencer fit
   - commissionStructure: "20% recurring for 12 months" or "one-time $500"
   - targetAffiliates: [specific names/types]
   - managementTooling: Rewardful, PartnerStack, or custom
   - whenToLaunch: "At $10K MRR" or "after first 50 customers"

5. PARTNERSHIP STRATEGY (for ecosystem plays):
   - applies: true for products that enhance existing tools
   - strategicPartners: [{ type (integration|reseller|co-marketing), target (company name), value (what they get), outreachPlan }]
   - partnerEnablement: Co-marketing materials, partner training, revenue share

6. COMMUNITY FLYWHEEL (for products with passionate users):
   - applies: true if users want to learn/share/contribute
   - platformChoice: Discord | Slack | Circle | Forum | Reddit
   - seedingStrategy: How to get first 100 members
   - moderationPlan: Rules, moderation tools
   - contributionRewards: Recognition, credits, early access
   - ugcStrategy: User-generated content (templates, tutorials, integrations)

For each channel: Only specify if applies === true. If doesn't apply, omit or set applies === false.

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      seoStrategy: { primaryKeywords: [], longTailKeywords: [], contentPillars: [], technicalSEOChecklist: [] },
      contentMarketing: { blogPosts: [], contentCalendar: "string", distributionPlan: [] },
      launchPlaybook: { preLaunch: {}, launchDay: { productHunt: {}, hackerNews: {}, reddit: [], emailBlast: {} }, postLaunch: {} },
      emailMarketing: { leadMagnet: "string", welcomeSequence: [], launchSequence: [] },
      growthLoops: [],
      socialMedia: { platformSelection: [], contentThemes: [], postingCadence: "string" },
      microBudgetAds: { platform: "string", dailyBudget: "string", adCopyVariations: [] },
      conversionFunnel: { stages: [], expectedConversionRates: {}, optimizationPriority: [] },
      analyticsEventTaxonomy: [{ eventName: "string", category: "string", properties: [], trigger: "string" }],
      programmaticGrowth: {
        apiAsDistribution: { applies: "boolean", webhookStrategy: "string", embeddableWidgets: [{ widgetType: "string", targetPlatforms: ["string"], implementation: "string" }], developerDocs: "string", sandboxEnvironment: "boolean" },
        marketplaceStrategy: { applies: "boolean", targetMarketplaces: [{ platform: "Shopify|Salesforce|HubSpot|etc", fit: "string", timeline: "string" }], integrationDepth: "shallow-oauth|deep-bi-directional|native-ui" },
        referralEngine: { applies: "boolean", incentiveStructure: { referrerReward: "string", refereeReward: "string", viralCoefficient: "string" }, mechanics: "string", trackingImplementation: "string", bootstrapCost: "string" },
        affiliateProgram: { applies: "boolean", commissionStructure: "string", targetAffiliates: ["string"], managementTooling: "string", whenToLaunch: "string" },
        partnershipStrategy: { applies: "boolean", strategicPartners: [{ type: "integration|reseller|co-marketing", target: "string", value: "string", outreachPlan: "string" }], partnerEnablement: "string" },
        communityFlywheel: { applies: "boolean", platformChoice: "Discord|Slack|Circle|Forum|Reddit", seedingStrategy: "string", moderationPlan: "string", contributionRewards: "string", ugcStrategy: "string" }
      }
    };
  }

  getPhaseRubric(): string[] {
    return [
      "bootstrap_feasibility — can ALL of this be done by 1 person with $0?",
      "channel_specificity — are these real subreddits, real communities?",
      "seo_actionability — are keywords specific enough to target?",
      "launch_day_readiness — could you execute launch day from this document alone?",
    ];
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} launch product hunt tips 2025`,
      `${idea} hacker news show hn`,
      `${idea} reddit marketing strategy`,
      `${idea} SEO keywords long tail`,
      `${idea} content marketing bootstrapped`,
      `${idea} first 100 customers without ads`,
      `bootstrapped saas launch playbook`,
      `${idea} lead magnet ideas`,
    ];
  }

  async run(ctx: AgentContext, input: GTMInput): Promise<AgentResult<GTMOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const queries = this.getSearchQueries(idea);
    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of queries) {
      searchResults.push({ query: q, results: await webSearch(q, this.env, { maxResults: 6, searchDepth: this.config.searchDepth, deduplicate: true }) });
    }

    const context = [
      this.buildContextPrompt(ctx),
      "Search results:",
      JSON.stringify(searchResults.map((s) => ({ query: s.query, snippets: s.results.slice(0, 3).map((r) => ({ title: r.title, content: r.content?.slice(0, 250) })) })), null, 2),
    ].join("\n\n");

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce bootstrap GTM AND programmatic growth strategy. Use Phase 1 watering holes, Phase 2 pricing, Phase 3 competitor SEO.

CRITICAL PROGRAMMATIC GROWTH:
1. API-as-distribution: If product has API or developer audience, specify webhooks, embeddable widgets, sandbox
2. Marketplace strategy: If B2B SaaS, identify best marketplace (Shopify, Salesforce, HubSpot, etc.)
3. Referral engine: If viral potential, design incentive structure with viral coefficient target
4. Affiliate program: If high LTV, specify commission structure and target affiliates
5. Partnership strategy: Identify integration, reseller, or co-marketing partners
6. Community flywheel: If passionate user base, design community platform and seeding strategy

For each channel: Set applies === true only if genuinely applicable. Don't force every channel.

${context}

Output valid JSON matching the schema. Include analyticsEventTaxonomy for foundation POST /api/analytics/event.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: this.config.maxTokens ?? 6144 });
      const parsed = extractJSON(response);
      const output = GTMOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("GTMAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

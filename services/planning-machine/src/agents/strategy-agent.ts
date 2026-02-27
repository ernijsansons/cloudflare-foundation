/**
 * Phase 5: Bootstrap Strategy and Positioning Agent
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { StrategyOutputSchema, type StrategyOutput } from "../schemas/strategy";
import { webSearch } from "../tools/web-search";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

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
      "Does the brand architecture include anti-category framing to differentiate from incumbents?",
      "Are primary brand colors psychologically aligned with positioning (trust, innovation, accessibility)?",
      "Is the domain strategy comprehensive (primary, alternatives, subdomains, future naming)?",
    ],
    maxTokens: 4096,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at startup positioning, strategy, AND comprehensive brand architecture. Produce positioning statement, brand voice, wedge strategy, differentiation axes, and complete brand architecture.

POSITIONING FORMAT: For [target], who [situation], [product] is a [category] that [key benefit] unlike [alternative] which [competitor weakness].

AGENTIC MANDATE: Position as a data-driven agentic application, NOT traditional SaaS. Include in strategicNarrative:
- agenticVision: How the product evolves from tool to autonomous agent
- dataFlywheel: What data compounds and how it creates moat (more usage = smarter agents)

BRAND ARCHITECTURE (Phase 2 - COMPREHENSIVE):

1. ANTI-CATEGORY FRAMING:
   - categoryWeReject: What existing category box do we reject? (e.g., "We're not a CRM")
   - whyWeDontFit: Why that category doesn't capture what we do
   - newCategoryWereCreating: What new category are we defining? (e.g., "Revenue Intelligence Platform")

2. VISUAL IDENTITY:
   - primaryBrandColor: { hex (e.g., "#4F46E5"), psychology (what emotion), competitive (how different from competitors) }
   - secondaryColors: [{ hex, purpose }] (accent, background, text colors)
   - logoDirection: Describe logo concept/metaphor
   - visualMetaphors: [symbols, imagery that represent the brand]

3. DOMAIN STRATEGY:
   - primaryDomain: { suggestion (ideal .com), availability (available|check-required|taken), cost ("$10/yr" or "$5K premium") }
   - alternativeDomains: [{ domain, reasoning }] (if primary not available)
   - subdomainStrategy: { app: "app.domain.com", api: "api.domain.com", marketing: "www.domain.com" }
   - futureProductNaming: Strategy for future product names (e.g., "All products named after [theme]")

4. PSYCHOLOGICAL FRAMEWORK:
   - statusSignaling: What status does using this product confer? (e.g., "Early adopter of AI-native tools")
   - trustSignals: [credibility indicators] (e.g., "SOC2 certified", "Used by YC companies", "Open source")
   - anchoringMechanisms: [pricing/value anchors] (e.g., "Replaces $50K/yr sales rep")
   - brandAssociations: [brands we want to be associated with] (e.g., "Think Stripe for payments, but for sales")

5. BRAND MOAT:
   - howBrandCompounds: How does brand get stronger over time?
   - networkEffectsOnBrand: Does brand benefit from network effects? (e.g., "Every company using us makes category more legitimate")
   - defensivePositioning: How does brand positioning defend against competitors?

VISUAL IDENTITY PSYCHOLOGY:
- Blue (#0047AB): Trust, stability, enterprise (e.g., Salesforce, LinkedIn)
- Purple (#7C3AED): Innovation, creativity, premium (e.g., Stripe, Twitch)
- Green (#10B981): Growth, money, sustainability (e.g., Robinhood, Mint)
- Orange (#F97316): Energy, accessibility, friendliness (e.g., HubSpot, Asana)
- Red (#EF4444): Urgency, passion, boldness (e.g., YouTube, Airbnb)
- Black (#000000): Luxury, sophistication, minimalism (e.g., Apple, Uber)

COMPETITIVE COLOR ANALYSIS: Research Phase 3 competitors - choose colors that differentiate. If all competitors use blue, consider purple or green.

Produce valid JSON matching the schema with ALL brand architecture fields populated.`;
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
      brandArchitecture: {
        antiCategoryFraming: { categoryWeReject: "string", whyWeDontFit: "string", newCategoryWereCreating: "string" },
        visualIdentity: {
          primaryBrandColor: { hex: "#RRGGBB", psychology: "string", competitive: "string" },
          secondaryColors: [{ hex: "#RRGGBB", purpose: "string" }],
          logoDirection: "string",
          visualMetaphors: ["string"]
        },
        domainStrategy: {
          primaryDomain: { suggestion: "domain.com", availability: "available|check-required|taken", cost: "$X/yr or $Y premium" },
          alternativeDomains: [{ domain: "string", reasoning: "string" }],
          subdomainStrategy: { app: "app.domain.com", api: "api.domain.com", marketing: "www.domain.com" },
          futureProductNaming: "string"
        },
        psychologicalFramework: {
          statusSignaling: "string",
          trustSignals: ["string"],
          anchoringMechanisms: ["string"],
          brandAssociations: ["string"]
        },
        brandMoat: {
          howBrandCompounds: "string",
          networkEffectsOnBrand: "string",
          defensivePositioning: "string"
        }
      }
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
      { role: "user" as const, content: `Produce strategy, positioning, AND comprehensive brand architecture.

CRITICAL BRAND ARCHITECTURE REQUIREMENTS:
1. Anti-category framing: Define what category we reject and what new category we're creating
2. Visual identity: Primary brand color with psychology + competitive analysis from Phase 3
3. Domain strategy: Check domain availability, provide alternatives, subdomain strategy
4. Psychological framework: Status signaling, trust signals, anchoring, associations
5. Brand moat: How brand compounds, network effects, defensive positioning

Use Phase 2 customer intel for positioning, Phase 3 competitive intel for visual differentiation.

${context}

Output valid JSON matching the schema with ALL brand architecture fields populated.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: 4096 });
      const parsed = extractJSON(response);
      const output = StrategyOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("StrategyAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

/**
 * Phase 1: Customer Deep Intelligence Agent
 * Produces a dossier on the exact human the product is built for
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { CustomerIntelOutputSchema, type CustomerIntelOutput } from "../schemas/customer-intel";
import { webSearch } from "../tools/web-search";
import type { Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface CustomerIntelInput {
  idea: string;
  refinedIdea?: string;
}

export class CustomerIntelAgent extends BaseAgent<CustomerIntelInput, CustomerIntelOutput> {
  config = {
    phase: "customer-intel",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Would this person pay with their personal credit card before getting approval?",
      "Can you name 3 subreddits with >10K members where they complain about this?",
      "What exact words does this customer Google at 2am when the pain is worst?",
      "What are they currently cobbling together with spreadsheets/manual work?",
      "If you cold-emailed 100 of these people, would 10+ reply? Why?",
    ],
    maxTokens: 4096,
    searchDepth: "advanced" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at understanding the exact human a product is built for.

COMPLETENESS REQUIREMENTS:
- idealCustomerProfiles: Exactly 2-3 profiles. Each MUST have:
  - demographics: Specific job title (not "various") + company size (1-10, 11-50, etc.)
  - psychographics: Values, fears, aspirations - be specific, not generic
  - painPoints: At least 3, each with exactQuote from search results and source URL
  - buyingTriggers: 3+ specific moments when they start searching
  - currentSolutions: What tools they cobble together now, what they pay, what they hate
  - wateringHoles: At least 3 real communities with URLs and member counts
    - MUST be real: r/subreddit with actual URL, Slack/Discord with name, newsletters with link
  - searchBehavior: 5+ actual search queries they'd type at 2am
  - willingnessToPay: Dollar range with evidence (competitor pricing, forum mentions)

- customerLanguage: THE MOST IMPORTANT OUTPUT
  - exactWords: 10+ actual phrases customers use (from Reddit, forums, reviews)
  - phrases: 5+ longer expressions they say
  - metaphors: How they describe the problem
  - Pull DIRECTLY from search result quotes, don't paraphrase

- jobsToBeDone: At least 3 jobs in format:
  - functional: "When [situation], I want to [action]"
  - emotional: "So I can feel [emotion]"
  - social: "So others see me as [perception]"

- unknowns: List what you COULD NOT find. This helps synthesis phase identify gaps.

Every quote MUST have a source URL. Don't make up quotes.
This dossier feeds ALL downstream phases - be thorough.

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      idealCustomerProfiles: [
        {
          demographics: { jobTitle: "string", companySize: "string", industry: "string" },
          psychographics: { values: ["string"], fears: ["string"], aspirations: ["string"], identity: "string" },
          painPoints: [{ description: "string", severity: "hair_on_fire|high|medium|nice_to_have", exactQuote: "string", source: "string" }],
          buyingTriggers: ["string"],
          currentSolutions: [{ tool: "string", whatTheyPay: "string", whatTheyHate: "string" }],
          switchingCosts: "string",
          wateringHoles: [{ type: "subreddit|forum|slack|discord|newsletter|podcast|twitter", name: "string", url: "string", memberCount: "string" }],
          searchBehavior: ["string"],
          willingnessToPay: { min: "number", max: "number", currency: "USD", evidence: "string" },
          decisionProcess: { whoDecides: "string", whoInfluences: "string", timeline: "string" },
        },
      ],
      customerLanguage: { exactWords: ["string"], phrases: ["string"], metaphors: ["string"] },
      jobsToBeDone: [{ functional: "string", emotional: "string", social: "string" }],
      unknowns: ["string"],
    };
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} reddit frustrated`,
      `${idea} forum complaint`,
      `${idea} "willing to pay" OR "shut up and take my money"`,
      `${idea} slack community OR discord server`,
      `${idea} podcast OR newsletter`,
      `${idea} "switched from" OR "moved to"`,
      `${idea} freelancer OR solo founder OR small team`,
      `site:reddit.com "${idea}" solution`,
      `${idea} "how do you" OR "what do you use for"`,
      `${idea} alternative reviews`,
    ];
  }

  getPhaseRubric(): string[] {
    return [
      "customer_language_specificity — are there ACTUAL quotes from real people?",
      "buying_trigger_clarity — can you name the exact moment they start searching?",
      "watering_hole_precision — are these real, linkable communities?",
    ];
  }

  async run(
    ctx: AgentContext,
    input: CustomerIntelInput
  ): Promise<AgentResult<CustomerIntelOutput>> {
    const idea = input.refinedIdea ?? input.idea;
    const searchQueries = this.getSearchQueries(idea);

    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of searchQueries) {
      const results = await webSearch(q, this.env, {
        maxResults: 8,
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
          snippets: s.results.slice(0, 4).map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content?.slice(0, 500),
            provider: r.provider,
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
        content: `Analyze this idea and produce customer intelligence. Use ONLY the search results as evidence.\n\n${context}\n\nOutput valid JSON matching the schema.`,
      },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.5,
        maxTokens: this.config.maxTokens ?? 4096,
      });

      const parsed = extractJSON(response);
      const output = CustomerIntelOutputSchema.parse(parsed);

      return {
        success: true,
        output,
      };
    } catch (e) {
      console.error("CustomerIntelAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }
}

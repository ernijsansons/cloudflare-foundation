/**
 * Phase 8: Bootstrap GTM and Growth Engine
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { GTMOutputSchema, type GTMOutput } from "../schemas/gtm";

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
    ],
    maxTokens: 6144,
    searchDepth: "advanced" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at bootstrap GTM. Produce $0-budget launch bible: SEO strategy, content calendar, launch playbook (Product Hunt, HN, Reddit), email sequences, growth loops, analytics event taxonomy. Use customer language from Phase 1. Name SPECIFIC subreddits, newsletters, communities. Produce valid JSON matching the schema.`;
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
      { role: "user" as const, content: `Produce bootstrap GTM. Use Phase 1 watering holes, Phase 2 pricing, Phase 3 competitor SEO.\n\n${context}\n\nOutput valid JSON matching the schema. Include analyticsEventTaxonomy for foundation POST /api/analytics/event.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: this.config.maxTokens ?? 6144 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      const output = GTMOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("GTMAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

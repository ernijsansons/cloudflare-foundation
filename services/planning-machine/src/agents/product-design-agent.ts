/**
 * Phase 7: Product and UX/UI Design Intelligence
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { ProductDesignOutputSchema, type ProductDesignOutput } from "../schemas/product-design";

interface ProductDesignInput {
  idea: string;
  refinedIdea?: string;
}

export class ProductDesignAgent extends BaseAgent<ProductDesignInput, ProductDesignOutput> {
  config = {
    phase: "product-design",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "If you showed this landing page to the Phase 1 ICP for 5 seconds, would they understand what it does?",
      "Does the CTA button text use the customer's language or YOUR language?",
      "What does the dashboard look like when the user has zero data?",
    ],
    maxTokens: 6144,
    searchDepth: "advanced" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at conversion-optimized SaaS design. Produce landing page blueprint with actual headlines/colors/CTAs, design system with hex codes, ALL app pages (not just landing), copy guidance, conversion optimization. Use customer language from Phase 1. Every design choice must have psychological reasoning.

MAP REQUIREMENT: If the product includes a map or location-based features, set recommendedTechStack.mapLibrary: "MapLibre" and mapLibraryReason: "free, open-source, Cloudflare-compatible". Never recommend Google Maps API for bootstrap.

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      mvpScope: { userStories: ["string"], featurePriority: [{ feature: "string", priority: "must_have|nice_to_have|future", reasoning: "string" }], outOfScope: ["string"] },
      informationArchitecture: { siteMap: [{ path: "string", purpose: "string" }], userFlows: ["string"], activationMetric: "string" },
      landingPageBlueprint: { aboveTheFold: { headline: "string", subheadline: "string", ctaText: "string", ctaColor: "string", socialProof: "string" }, sections: [{ purpose: "string", headline: "string", copyFramework: "string", contentGuidance: "string" }] },
      appPages: [{ route: "string", purpose: "string", layout: "string", components: ["string"], dataNeeded: ["string"], emptyState: "string", loadingState: "string", errorState: "string" }],
      designSystem: { colorPalette: { primary: "string", primaryReasoning: "string", secondary: "string", accent: "string", background: "string", surface: "string", text: "string", emotionalReasoning: "string" }, typography: { headingFont: "string", bodyFont: "string" }, spacing: "string", borderRadius: "string", iconStyle: "string" },
      copyGuidance: { voiceAndTone: "string", headlineFormulas: ["string"], ctaVariations: ["string"], microcopy: {}, socialProofStrategy: "string" },
      conversionOptimization: { frictionPoints: ["string"], trustSignals: ["string"], urgencyTactics: ["string"] },
      accessibilityRequirements: ["string"],
      performanceBudget: { lcp: "string", fid: "string", cls: "string" },
      recommendedTechStack: { framework: "string", styling: "string", hosting: "string", claudeCodeSkills: ["string"], mapLibrary: "string", mapLibraryReason: "string" },
    };
  }

  getPhaseRubric(): string[] {
    return [
      "design_specificity — are there actual hex codes, font names, headline text?",
      "conversion_optimization — does the landing page blueprint follow proven patterns?",
      "customer_language_usage — does the copy use exact words from Phase 1?",
      "full_page_coverage — are ALL app pages designed?",
    ];
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} landing page conversion`,
      `${idea} color psychology trust`,
      `saas landing page high converting 2025`,
      `${idea} above the fold best practices`,
      `${idea} design system`,
    ];
  }

  async run(ctx: AgentContext, input: ProductDesignInput): Promise<AgentResult<ProductDesignOutput>> {
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
      { role: "user" as const, content: `Produce product and UX/UI design. Use Phase 1 customer language, Phase 3 competitor design, Phase 5 brand voice.\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: this.config.maxTokens ?? 6144 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      const output = ProductDesignOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("ProductDesignAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

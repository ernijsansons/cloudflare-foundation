/**
 * Phase 9: Content Engine Agent
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { ContentEngineOutputSchema, type ContentEngineOutput } from "../schemas/content-engine";
import { extractJSON } from "../lib/json-extractor";

interface ContentEngineInput {
  idea: string;
  refinedIdea?: string;
}

export class ContentEngineAgent extends BaseAgent<ContentEngineInput, ContentEngineOutput> {
  config = {
    phase: "content-engine",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Is there copy for EVERY screen, email, error, and empty state?",
      "Do error messages help the user, not blame them?",
      "Are GDPR basics covered?",
    ],
    maxTokens: 6144,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at product copy. Produce ALL words: onboarding, transactional emails, empty states, error messages, success messages, FAQ, legal requirements. Use Phase 5 brand voice. Every screen and state must have copy. Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      onboardingCopy: { steps: [], welcomeScreen: {}, firstRunGuidance: {} },
      transactionalEmails: { welcome: {}, passwordReset: {}, trialExpiring: {}, invoiceReceipt: {}, featureAnnouncement: {} },
      emptyStates: [{ pageRoute: "string", headline: "string", body: "string", ctaText: "string", illustration: "string" }],
      errorMessages: { validation: {}, apiErrors: {}, networkErrors: {}, paymentErrors: {} },
      successMessages: {},
      loadingStates: {},
      faqContent: [{ question: "string", answer: "string", category: "string" }],
      legalRequirements: { privacyPolicy: {}, termsOfService: {}, cookieConsent: {}, gdprCompliance: {} },
      changelogFormat: { template: "string", frequency: "string" },
    };
  }

  getSearchQueries(idea: string): string[] {
    return [
      `${idea} onboarding best practices`,
      `${idea} transactional email templates`,
      `SaaS empty state copy examples`,
      `error message UX best practices`,
      `${idea} FAQ common questions`,
      `privacy policy SaaS GDPR`,
    ];
  }

  async run(ctx: AgentContext, input: ContentEngineInput): Promise<AgentResult<ContentEngineOutput>> {
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
      { role: "user" as const, content: `Produce content engine. Use Phase 5 brand voice. App pages from Phase 7 need empty states. Legal from Phase 6/8.\n\n${context}\n\nOutput valid JSON matching the schema.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: this.config.maxTokens ?? 6144 });
      const parsed = extractJSON(response);
      const output = ContentEngineOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("ContentEngineAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

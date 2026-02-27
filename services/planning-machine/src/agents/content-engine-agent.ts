/**
 * Phase 9: Content Engine Agent
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { ContentEngineOutputSchema, type ContentEngineOutput } from "../schemas/content-engine";
import { webSearch } from "../tools/web-search";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

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
      "Are legal compliance requirements comprehensively analyzed (GDPR, CCPA, EU AI Act, SOC2, HIPAA)?",
      "Is there a bootstrap compliance roadmap distinguishing launch-blockers vs. deferrable items?",
      "For EU customers: Are data residency, retention, and GDPR requirements specified?",
      "For agentic/AI products: Are AI disclosure requirements and EU AI Act tier classification specified?",
    ],
    maxTokens: 6144,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at product copy AND legal/compliance analysis. Produce ALL words: onboarding, transactional emails, empty states, error messages, success messages, FAQ. ALSO produce comprehensive legal/compliance analysis (expanded beyond just copy templates).

Use Phase 5 brand voice for copy. Every screen and state must have copy.

LEGAL & COMPLIANCE ANALYSIS (EXPANDED):
legalRequirements must now include comprehensive analysis, not just empty placeholder objects:

1. APPLICABLE REGULATIONS:
   - GDPR: { applies: boolean (EU customers?), requirements: [list], implementationCost: string, launchBlocker: boolean }
   - CCPA: { applies: boolean (CA/US customers?), requirements: [list], implementationCost: string, launchBlocker: boolean }
   - EU AI Act: { applies: boolean (AI/ML product?), tier: "minimal|limited|high|unacceptable", requirements: [list], launchBlocker: boolean }
   - industrySpecific: [{ regulation: "HIPAA|FINRA|PCI-DSS", applies: boolean, requirements: [list], certificationRequired: boolean }]

2. DATA GOVERNANCE:
   - dataResidency: { required: boolean, regions: [EU, US, etc.], cloudflareStrategy: "R2 regions, D1 regions" }
   - retentionPolicy: { userData: "X years", analyticsData: "Y days", auditLogs: "Z years (compliance)", backups: "N days", deletionProcedure: "steps" }
   - dataClassification: { pii: [fields], sensitive: [fields], public: [fields] }

3. AI DISCLOSURE (for AI/agentic products):
   - required: boolean
   - disclosureText: "AI-generated content disclaimer"
   - userConsentRequired: boolean

4. AUDIT & LOGGING:
   - auditLogRetention: "7 years for SOC2/HIPAA"
   - loggingRequirements: [what events must be logged]
   - immutableAuditTrail: "Plane 10 Audit Hash Chain"

5. COMPLIANCE CERTIFICATIONS:
   - soc2: { required: boolean, type: "Type I|Type II", timeline: "when", bootstrapCost: "$X" }
   - iso27001: { required: boolean, timeline: "when", bootstrapCost: "$X" }
   - hipaa: { required: boolean, baa Required: boolean, timeline: "when" }

6. RISK MATRIX:
   - [{ risk: "description", likelihood: "high|medium|low", impact: "high|medium|low", mitigation: "steps", bootstrapPriority: "launch-blocker|month-1|year-1" }]

7. BOOTSTRAP COMPLIANCE:
   - launchBlockers: [list of must-have-before-launch compliance items]
   - canDeferUntil: [{ milestone: "$10K MRR", items: [compliance items that can wait] }]
   - freeTooling: [free compliance tools for bootstrap]
   - whenToHireLawyer: "At $X MRR or Y customers"

8. VENDOR COMPLIANCE:
   - thirdPartyVendors: [{ vendor: "Stripe|Anthropic|etc", dpaRequired: boolean, certifications: ["SOC2", "ISO"], riskLevel: "low|medium|high" }]

9. INDEMNITY & LIABILITY:
   - userAgreementLiability: "Limited to subscription amount"
   - warrantyDisclaimer: "AS IS where permitted"
   - dmcaCompliance: boolean (if user-generated content)

Produce valid JSON matching the schema with ALL legal fields populated.`;
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
      legalRequirements: {
        "_note": "COMPREHENSIVE COMPLIANCE ANALYSIS (not just copy templates)",
        applicableRegulations: {
          gdpr: { applies: "boolean", requirements: ["string"], implementationCost: "string", launchBlocker: "boolean" },
          ccpa: { applies: "boolean", requirements: ["string"], implementationCost: "string", launchBlocker: "boolean" },
          euAiAct: { applies: "boolean", tier: "minimal|limited|high|unacceptable", requirements: ["string"], launchBlocker: "boolean" },
          industrySpecific: [{ regulation: "HIPAA|FINRA|PCI-DSS", applies: "boolean", requirements: ["string"], certificationRequired: "boolean" }]
        },
        dataGovernance: {
          dataResidency: { required: "boolean", regions: ["string"], cloudflareStrategy: "string" },
          retentionPolicy: { userData: "string", analyticsData: "string", auditLogs: "string", backups: "string", deletionProcedure: "string" },
          dataClassification: { pii: ["string"], sensitive: ["string"], public: ["string"] }
        },
        aiDisclosure: { required: "boolean", disclosureText: "string", userConsentRequired: "boolean" },
        auditAndLogging: { auditLogRetention: "string", loggingRequirements: ["string"], immutableAuditTrail: "string" },
        complianceCertifications: {
          soc2: { required: "boolean", type: "Type I|Type II", timeline: "string", bootstrapCost: "string" },
          iso27001: { required: "boolean", timeline: "string", bootstrapCost: "string" },
          hipaa: { required: "boolean", baaRequired: "boolean", timeline: "string" }
        },
        riskMatrix: [{ risk: "string", likelihood: "high|medium|low", impact: "high|medium|low", mitigation: "string", bootstrapPriority: "launch-blocker|month-1|year-1" }],
        bootstrapCompliance: {
          launchBlockers: ["string"],
          canDeferUntil: [{ milestone: "string", items: ["string"] }],
          freeTooling: ["string"],
          whenToHireLawyer: "string"
        },
        vendorCompliance: [{ vendor: "string", dpaRequired: "boolean", certifications: ["string"], riskLevel: "low|medium|high" }],
        indemnityAndLiability: { userAgreementLiability: "string", warrantyDisclaimer: "string", dmcaCompliance: "boolean" }
      },
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
      { role: "user" as const, content: `Produce content engine. Use Phase 5 brand voice. App pages from Phase 9 need empty states.

CRITICAL LEGAL ANALYSIS:
1. Check Phase 2 target customers: Are they in EU (GDPR), California (CCPA), or regulated industries (HIPAA, FINRA)?
2. Check Phase 9: Is isAgenticSoftware true? If yes, EU AI Act applies - classify tier (minimal/limited/high/unacceptable)
3. Produce COMPREHENSIVE legalRequirements analysis - not just empty objects, but full compliance roadmap
4. Distinguish launch-blockers (must have before launch) vs. deferrable (can wait until $X MRR)
5. For bootstrap: identify free compliance tools and when to hire lawyer

${context}

Output valid JSON matching the schema with ALL legal fields populated with analysis.` },
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

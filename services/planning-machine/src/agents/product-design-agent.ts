/**
 * Phase 7: Product and UX/UI Design Intelligence
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { ProductDesignOutputSchema, type ProductDesignOutput } from "../schemas/product-design";
import { webSearch } from "../tools/web-search";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

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
      "Is this agentic software? If yes, is agent governance fully specified (roles, permissions, memory, kill switches)?",
      "For agentic software: Does the ID strategy use deterministic hash-based IDs for idempotent creation?",
    ],
    maxTokens: 6144,
    searchDepth: "advanced" as const,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at conversion-optimized SaaS design AND agentic software architecture. Produce landing page blueprint with actual headlines/colors/CTAs, design system with hex codes, ALL app pages (not just landing), copy guidance, conversion optimization. Use customer language from Phase 1. Every design choice must have psychological reasoning.

MAP REQUIREMENT: If the product includes a map or location-based features, set recommendedTechStack.mapLibrary: "MapLibre" and mapLibraryReason: "free, open-source, Cloudflare-compatible". Never recommend Google Maps API for bootstrap.

AGENTIC SOFTWARE REQUIREMENTS:
First, determine: Is this agentic software? (AI agents making autonomous decisions, multi-step workflows, durable execution)

If YES (isAgenticSoftware: true), you MUST specify comprehensive agentGovernance:

1. AGENT ROLES: Define each agent (primary, sub-agent, supervisor, worker) with:
   - name, type, responsibility
   - autonomyLevel: fully-autonomous | supervised | human-approval-required

2. PERMISSION MATRIX: For each agent role:
   - allowedTools: list of MCP tools this agent can call
   - forbiddenActions: what this agent must never do
   - escalationRules: when to escalate to human or supervisor agent

3. MEMORY ARCHITECTURE:
   - agentSpecificMemory: which D1 tables, R2 buckets, KV namespaces, Vectorize indexes each agent owns
   - sharedMemory: what memory is shared across agents
   - segmentationBoundaries: memory isolation rules

4. EXECUTION LIMITS:
   - maxRecursionDepth: prevent infinite agent loops
   - maxParallelAgents: limit concurrent agent execution
   - timeoutPerAgent: max execution time per agent
   - retryStrategy: maxRetries, backoff (linear|exponential)

5. KILL SWITCH CONDITIONS:
   - Define emergency stop conditions (e.g., "cost exceeds $100/hour", "recursion depth > 10")
   - Actions: pause-all | rollback | escalate-human

6. GOVERNANCE PATTERN:
   - single-agent: one primary agent, no delegation
   - commander-scout: commander dispatches scouts for tasks
   - supervisor-worker: supervisor monitors multiple workers
   - peer-swarm: agents collaborate as equals
   - hierarchical: tree structure with multiple levels

7. DETERMINISTIC ID STRATEGY (RECOMMENDED):
   - type: deterministic (not random)
   - deterministicInputs: ["tenantId", "userId", "taskType"]
   - hashAlgorithm: SHA-256 | SHA-512
   - encoding: base64 | hex
   - Benefits: idempotent creation, cross-session reconnect, no lookup table

If NO (isAgenticSoftware: false), omit agentGovernance entirely.

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
      isAgenticSoftware: "boolean (REQUIRED - determine if this involves AI agents with autonomous decision-making)",
      agentGovernance: {
        "_note": "REQUIRED if isAgenticSoftware === true, OMIT if false",
        agentRoles: [{ name: "string", type: "primary|sub-agent|supervisor|worker", responsibility: "string", autonomyLevel: "fully-autonomous|supervised|human-approval-required" }],
        permissionMatrix: [{ agentRole: "string", allowedTools: ["string"], forbiddenActions: ["string"], escalationRules: ["string"] }],
        memoryArchitecture: {
          agentSpecificMemory: { "agentName": { d1Tables: ["string"], r2Buckets: ["string"], kvNamespaces: ["string"], vectorizeIndexes: ["string"] } },
          sharedMemory: { d1Tables: ["string"], r2Buckets: ["string"] },
          segmentationBoundaries: "string"
        },
        executionLimits: { maxRecursionDepth: "number", maxParallelAgents: "number", timeoutPerAgent: "string", retryStrategy: { maxRetries: "number", backoff: "linear|exponential" } },
        killSwitchConditions: [{ condition: "string", action: "pause-all|rollback|escalate-human" }],
        governancePattern: "single-agent|commander-scout|supervisor-worker|peer-swarm|hierarchical",
        idStrategy: { type: "deterministic|random", deterministicInputs: ["tenantId", "userId", "taskType"], hashAlgorithm: "SHA-256", encoding: "base64", benefits: ["idempotent-creation", "cross-session-reconnect", "no-lookup-table"] }
      }
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
      { role: "user" as const, content: `Produce product and UX/UI design. Use Phase 1 customer language, Phase 3 competitor design, Phase 5 brand voice.

CRITICAL: Determine if this is agentic software (AI agents making autonomous decisions). If YES, set isAgenticSoftware: true and MUST specify complete agentGovernance with agent roles, permissions, memory architecture, execution limits, kill switches, governance pattern, and deterministic ID strategy. Check Phase 0 intake for allowed_actions, forbidden_actions, hitl_threshold constraints.

${context}

Output valid JSON matching the schema. If agentic software, agentGovernance is MANDATORY.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.5, maxTokens: this.config.maxTokens ?? 6144 });
      const parsed = extractJSON(response);
      const output = ProductDesignOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("ProductDesignAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

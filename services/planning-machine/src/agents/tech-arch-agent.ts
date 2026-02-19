/**
 * Phase 10: Technical Architecture Agent (Foundation-Mapped)
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { TechArchOutputSchema, type TechArchOutput } from "../schemas/tech-arch";
import { extractJSON } from "../lib/json-extractor";

interface TechArchInput {
  idea: string;
  refinedIdea?: string;
}

export class TechArchAgent extends BaseAgent<TechArchInput, TechArchOutput> {
  config = {
    phase: "tech-arch",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "Can you generate the Drizzle schema and D1 migration SQL from this output?",
      "Are all foreign keys to tenants and users correct?",
      "Does every API route have auth and request validation defined?",
    ],
    maxTokens: 8192,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at mapping product requirements to cloudflare-foundation-dev extension points. Produce Drizzle schemas, D1 migration SQL, Hono routes, SvelteKit pages, DO agents, wrangler changes. All output maps to packages/db, services/gateway, services/ui, services/agents, services/workflows, services/queues. Use existing: tenants, users, audit_chain, audit_log. Auth uses SESSION_KV.

COST-CONSCIOUS, 100% CLOUDFLARE-NATIVE: Every third-party integration must have a cost-conscious, Cloudflare-native alternative documented. If the product needs a map: use MapLibre, not Google Maps. Produce technicalDecisions array: for each integration category (maps, auth, email, search, storage, payments, etc.), list preferred (Cloudflare-native/free), avoid (paid/vendor-lock-in), reason, cloudflareNative.

Produce valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      databaseSchema: { newTables: [{ name: "string", drizzleCode: "string", migrationSQL: "string", relationships: ["string"] }], schemaFile: "string", migrationFile: "string" },
      apiRoutes: { routes: [{ method: "GET|POST|PATCH|DELETE", path: "string", requestBody: "string", responseBody: "string", auth: "required|optional|public", description: "string" }], gatewayChanges: "string" },
      sveltekitRoutes: { routes: [{ path: "string", files: ["string"], dataLoad: "string", components: ["string"] }] },
      durableObjects: { newAgents: [{ className: "string", stateShape: "string", methods: ["string"], wranglerBinding: "string" }] },
      workflows: { existingToFill: [], newWorkflows: [] },
      queueHandlers: { existingToFill: [], messageSchemas: {} },
      mcpTools: { newTools: [] },
      cronJobs: { jobs: [] },
      wranglerChanges: {},
      environmentVariables: { secrets: [], devVars: "string" },
      authFlowDecisions: { signupMethod: "string", sessionDuration: "string", roleBasedAccess: {} },
      thirdPartyIntegrations: [],
      technicalDecisions: [{ category: "string", preferred: "string", avoid: "string", reason: "string", cloudflareNative: "boolean" }],
    };
  }

  getPhaseRubric(): string[] {
    return [
      "foundation_compatibility — does this work within the existing monorepo?",
      "cost_consciousness — are all integrations Cloudflare-native or free alternatives?",
      "schema_completeness — can you create the migration from this output?",
      "route_specificity — are request/response types fully defined?",
      "zero_ambiguity — could Claude Code build this without asking questions?",
    ];
  }

  async run(ctx: AgentContext, input: TechArchInput): Promise<AgentResult<TechArchOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce technical architecture from prior phases. Phase 7 has app pages. Phase 6 has pricing/Stripe. Phase 8 has analytics events. Map ALL to foundation extension points.\n\n${context}\n\nOutput valid JSON matching the schema. Include actual migration SQL for new tables.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.3, maxTokens: this.config.maxTokens ?? 8192 });
      const parsed = extractJSON(response);
      const output = TechArchOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("TechArchAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}

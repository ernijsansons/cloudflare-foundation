/**
 * Phase 10: Technical Architecture Agent (Foundation-Mapped)
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { TechArchOutputSchema, type TechArchOutput } from "../schemas/tech-arch";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

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
      "Are Plane 10 security primitives configured (Audit Hash Chain, Context Tokens)?",
      "Does DO naming follow {tenantId}:{purpose}:{identifier} taxonomy?",
      "Are executable artifacts (SQL DDL, OpenAPI YAML, wrangler.jsonc, audit verification logic) complete?",
      "For agentic software: Are agent governance specs from Phase 9 mapped to DO bindings with Agents SDK v0.3.7+?",
    ],
    maxTokens: 8192,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are an expert at mapping product requirements to cloudflare-foundation-dev extension points. Produce Drizzle schemas, D1 migration SQL, Hono routes, SvelteKit pages, DO agents, wrangler changes. All output maps to packages/db, services/gateway, services/ui, services/agents, services/workflows, services/queues. Use existing: tenants, users, audit_chain, audit_log. Auth uses SESSION_KV.

COST-CONSCIOUS, 100% CLOUDFLARE-NATIVE: Every third-party integration must have a cost-conscious, Cloudflare-native alternative documented. If the product needs a map: use MapLibre, not Google Maps. Produce technicalDecisions array: for each integration category (maps, auth, email, search, storage, payments, etc.), list preferred (Cloudflare-native/free), avoid (paid/vendor-lock-in), reason, cloudflareNative.

PLANE 10 SECURITY (SOC2/HIPAA COMPLIANCE):
- MANDATORY: Configure auditHashChain with SHA-256 hash linking for immutable audit logs
- MANDATORY: Configure contextTokens (60s TTL, RS256, gateway-signed) for service-to-service auth
- Generate complete SQL DDL for audit_chain table with hash verification

CLOUDFLARE PRIMITIVES (ALL 22 MUST BE CONSIDERED):
1. Workers, Durable Objects, D1, R2, KV, Vectorize, Queues, Workflows
2. Agents SDK v0.3.7+ (AgentWorkflow, Agent.scheduleEvery patterns)
3. AI Gateway (BYOK pattern with Cloudflare Secrets, cost control, caching)
4. AI Bindings (Workers AI models)
5. Containers/Sandbox (code execution environments)
6. Turnstile (bot protection)
7. Access (zero trust auth)
8. WAF (security rules)
9. Rate Limiting (per-tenant/user)
10. Logpush (log aggregation)
11. Analytics Engine (metrics, datasets)
12. Hyperdrive (DB connection pooling)
13. Pages, Service Bindings
14. Workers VPC (Enterprise - private network access)

DURABLE OBJECTS TAXONOMY (CONSTRAINT 9):
- MANDATORY naming pattern: {tenantId}:{purpose}:{identifier}
- Good: "tenant_abc123:chat-agent:session_xyz789"
- Bad: "agent_xyz789" (no tenant scope)
- Include exampleId for each DO class
- For agentic software: extend Agents SDK base classes (ChatAgent, TaskAgent, TenantAgent, SessionAgent)

HIBERNATION FOR COST OPTIMIZATION:
- Enable hibernation for all DOs (100x cost savings: $20/mo vs $2,000/mo)
- Specify serializationStrategy: sqlite|in-memory|hybrid
- Set generateHandlers: true to auto-create serializeAttachment/deserializeAttachment

OBSERVABILITY (PRODUCTION-GRADE):
- Logpush configuration: dataset, retention, structure (json|text)
- Analytics Engine: datasets with indexes, blobs, doubles
- Tracing: enabled, samplingRate
- Custom metrics: counters, gauges, histograms
- Dashboard specifications

SECURITY POSTURE:
- WAF rules: name, action (block|challenge|log)
- Access policies: protectedPaths, identityProviders
- Zero trust: serviceToServiceAuth (context tokens), clientAuth, secretsRotation
- Encryption: at-rest (D1/R2/KV), in-transit (TLS)

EXECUTABLE ARTIFACTS (CRITICAL FOR RALPH LOOP):
- Generate complete SQL DDL (CREATE TABLE statements, indexes, foreign keys)
- Generate complete OpenAPI 3.1 YAML (paths, schemas, security)
- Generate complete wrangler.jsonc (Foundation v2.5 PREFERRED: JSON with $schema header for validation)
- Generate complete .env.example (all required environment variables)
- Generate audit chain verification logic (SQL query or Drizzle function to verify hash chain integrity)
- All artifacts must be ready to commit to repository without modification

Produce valid JSON matching the schema with ALL required fields populated.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      databaseSchema: {
        tables: [{ name: "string", columns: [{ name: "string", type: "TEXT|INTEGER|REAL|BLOB|DATETIME", nullable: "boolean", primaryKey: "boolean", unique: "boolean", defaultValue: "string?" }], indexes: [], foreignKeys: [] }],
        migrations: [],
        auditHashChain: { enabled: "boolean", tableName: "audit_chain", hashAlgorithm: "SHA-256", fields: {}, verification: {} }
      },
      apiRoutes: { routes: [{ method: "GET|POST|PATCH|DELETE", path: "string", requestBody: {}, responseBody: {}, auth: "required|optional|public", description: "string" }] },
      sveltekitRoutes: { routes: [{ path: "string", files: ["string"], dataLoad: "string", components: ["string"] }] },
      cloudflareBindings: {
        d1: { databases: ["string"] },
        r2: { buckets: ["string"] },
        kv: [{ namespace: "string", purpose: "string", ttlStrategy: "string" }],
        vectorize: [{ index: "string", dimensions: "number", metric: "cosine|euclidean", purpose: "string" }],
        durableObjects: [{ className: "string", binding: "string", extendsAgentSDK: "ChatAgent|TaskAgent|TenantAgent|SessionAgent|BaseAgent|null", stateSchema: {}, usesSQLite: "boolean", usesWebSockets: "boolean", namingPattern: "{tenantId}:{purpose}:{identifier}", exampleId: "string", hibernation: { enabled: true, serializationStrategy: "sqlite|in-memory|hybrid", wakeupThreshold: "30s", generateHandlers: true } }],
        queues: [{ name: "string", purpose: "string", retryLimit: "number", dlq: "boolean" }],
        workflows: [{ name: "string", steps: [], pausePoints: [], estimatedDuration: "string" }],
        aiGateway: { enabled: "boolean", gatewayId: "string", costBudget: {}, cachingStrategy: "string", logLevel: "string" },
        agentsSDK: { version: "0.3.7+", patterns: {} },
        containers: [],
        turnstile: [],
        access: { enabled: "boolean", protectedPaths: [], identityProviders: [] },
        waf: { enabled: "boolean", rules: [] },
        rateLimiting: [],
        logpush: { enabled: "boolean", dataset: "string", retention: "string" },
        analyticsEngine: [{ dataset: "string", purpose: "string" }],
        hyperdrive: [],
        pages: { enabled: "boolean" },
        serviceBindings: [],
        vpc: { enabled: "boolean", vpcId: "string", subnets: [], purpose: "string" }
      },
      contextTokens: { enabled: "boolean", signingService: "gateway", ttl: "60s", algorithm: "RS256", headerName: "X-Context-Token" },
      observability: {
        logging: { strategy: "logpush|analytics_engine|both", logpushDataset: "string", retention: "string" },
        metrics: { analyticsEngine: {}, customMetrics: [] },
        tracing: { enabled: "boolean", samplingRate: "number" },
        dashboards: []
      },
      securityPosture: {
        waf: { enabled: "boolean", rules: [] },
        access: { enabled: "boolean", protectedPaths: [] },
        zeroTrust: { serviceToServiceAuth: "context-tokens", clientAuth: "string", secretsRotation: "string" },
        encryption: { atRest: "D1|R2|KV encryption", inTransit: "TLS 1.3" }
      },
      executableArtifacts: {
        sqlDDL: "string (complete CREATE TABLE statements)",
        openAPISpec: "string (complete OpenAPI 3.1 YAML)",
        wranglerConfig: "string (legacy wrangler.toml - deprecated)",
        wranglerConfigJSONC: "string (Foundation v2.5 PREFERRED: complete wrangler.jsonc with $schema header)",
        auditChainVerificationLogic: "string (SQL query or Drizzle function to verify audit chain integrity)",
        envExample: "string (complete .env.example)",
        cicdPipeline: "string (optional: GitHub Actions workflow)"
      },
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

  async run(ctx: AgentContext, _input: TechArchInput): Promise<AgentResult<TechArchOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce technical architecture from prior phases. Phase 9 has agent governance (if isAgenticSoftware). Phase 8 has AI cost modeling. Phase 7 has app pages. Phase 6 has pricing/Stripe. Phase 11 has legal compliance requirements. Map ALL to foundation extension points.

CRITICAL REQUIREMENTS:
1. Configure Plane 10 security: auditHashChain (enabled: true, SHA-256) and contextTokens (enabled: true, 60s TTL)
2. All Durable Objects MUST follow naming pattern: {tenantId}:{purpose}:{identifier} with exampleId provided
3. For agentic software: Map Phase 9 agent governance to DO bindings with Agents SDK v0.3.7+ (extendsAgentSDK field)
4. Enable hibernation for ALL Durable Objects (100x cost savings)
5. Configure observability: Logpush dataset, Analytics Engine metrics, tracing
6. Configure security posture: WAF rules, Access policies, zero trust architecture
7. MANDATORY: Generate executableArtifacts with ALL fields populated:
   - sqlDDL: Complete CREATE TABLE statements with all constraints
   - openAPISpec: Complete OpenAPI 3.1 YAML specification
   - wranglerConfigJSONC (Foundation v2.5 PREFERRED): Complete wrangler.jsonc with $schema header
   - auditChainVerificationLogic: SQL query or Drizzle function to verify audit chain integrity
   - envExample: Complete .env.example with all required variables

${context}

Output valid JSON matching the schema. ALL fields must be populated with production-ready values.` },
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

/**
 * Architecture Advisor Output Schema
 *
 * Project Factory v3.0
 */

import { z } from "zod";

/**
 * CF binding specification
 */
const CFBindingSchema = z.object({
  name: z.string().describe("Binding name, e.g., DB, KV, R2"),
  type: z.string().describe("Wrangler binding type, e.g., d1_databases"),
  resource: z.string().optional().describe("Resource name"),
});

/**
 * Cost estimation
 */
const CostEstimateSchema = z.object({
  bootstrap: z.number().describe("Monthly cost at bootstrap ($0-20)"),
  growth: z.number().describe("Monthly cost at growth ($20-100)"),
  scale: z.number().describe("Monthly cost at scale ($100+)"),
  notes: z.string().optional().describe("Pricing caveats"),
});

/**
 * Motion design tier
 */
const MotionTierSchema = z.enum(["none", "basic", "premium", "linear-grade"]);

/**
 * Template recommendation
 */
const TemplateRecommendationSchema = z.object({
  slug: z.string().describe("Template identifier"),
  name: z.string().describe("Human-readable name"),
  score: z.number().min(0).max(100).describe("Match score 0-100"),
  reasoning: z.string().describe("Why this template fits"),
  bindings: z.array(CFBindingSchema).describe("Required CF bindings"),
  estimatedCost: CostEstimateSchema.describe("Monthly cost estimate"),
  motionTier: MotionTierSchema.describe("Frontend animation tier"),
  complexity: z.number().min(1).max(5).describe("1=trivial, 5=complex"),
  tradeoffs: z.array(z.string()).describe("Known tradeoffs"),
});

/**
 * API route specification
 */
const ApiRouteSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().describe("Route path, e.g., /api/users/:id"),
  description: z.string(),
  auth: z.enum(["none", "session", "api-key", "tenant"]),
  rateLimit: z.string().optional().describe("e.g., 100/min"),
});

/**
 * Database column
 */
const ColumnSchema = z.object({
  name: z.string(),
  type: z.string().describe("SQLite type"),
  nullable: z.boolean(),
  indexed: z.boolean().optional(),
  unique: z.boolean().optional(),
  foreignKey: z.string().optional().describe("e.g., users.id"),
});

/**
 * Database table
 */
const DataTableSchema = z.object({
  name: z.string().describe("snake_case table name"),
  description: z.string(),
  columns: z.array(ColumnSchema),
});

/**
 * Data model
 */
const BuildSpecDataModelSchema = z.object({
  tables: z.array(DataTableSchema),
  indexes: z.array(z.string()).describe("Index definitions"),
  migrations: z.array(z.string()).describe("Migration filenames"),
});

/**
 * Frontend specification
 */
const FrontendSpecSchema = z.object({
  framework: z.string().describe("e.g., react-router, svelte, astro"),
  pages: z.array(z.string()).describe("Route paths"),
  components: z.array(z.string()).describe("Key components"),
  motionTier: MotionTierSchema,
  styling: z.enum(["tailwind", "css", "styled-components"]),
});

/**
 * Agent specification
 */
const AgentSpecSchema = z.object({
  name: z.string().describe("DO class name"),
  type: z.enum(["chat", "task", "session", "custom"]),
  state: z.array(z.string()).describe("State keys"),
  tools: z.array(z.string()).optional().describe("MCP tools"),
  hibernation: z.boolean(),
});

/**
 * Growth path
 */
const GrowthPathSchema = z.object({
  fromTemplate: z.string(),
  toTemplate: z.string(),
  trigger: z.string().describe("When to upgrade"),
  effort: z.enum(["low", "medium", "high"]),
  steps: z.array(z.string()),
});

/**
 * Free win suggestion
 */
const FreeWinSchema = z.object({
  capability: z.string().describe("e.g., turnstile, analytics-engine"),
  benefit: z.string().describe("Why to add it"),
  effort: z.enum(["trivial", "easy", "moderate"]),
  freeQuota: z.string().describe("e.g., unlimited, 25M events/mo"),
});

/**
 * Architecture Advisor full output schema
 */
export const ArchitectureAdvisorOutputSchema = z.object({
  recommended: TemplateRecommendationSchema.describe("Top recommendation"),
  alternatives: z.array(TemplateRecommendationSchema).max(3).describe("Alternative options"),
  dataModel: BuildSpecDataModelSchema.describe("Database schema"),
  apiRoutes: z.array(ApiRouteSchema).describe("API endpoints"),
  frontend: FrontendSpecSchema.nullable().describe("Frontend spec or null for API-only"),
  agents: z.array(AgentSpecSchema).describe("Durable Object agents"),
  freeWins: z.array(FreeWinSchema).describe("Free CF products to add"),
  growthPath: GrowthPathSchema.nullable().describe("Future scaling path"),
  scaffoldCommand: z.string().describe("npm create command"),
  totalEstimatedMonthlyCost: CostEstimateSchema,
});

export type ArchitectureAdvisorOutput = z.infer<typeof ArchitectureAdvisorOutputSchema>;

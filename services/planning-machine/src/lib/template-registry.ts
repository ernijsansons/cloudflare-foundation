/**
 * Template Registry — Query functions for D1-backed template data
 *
 * Project Factory v3.0
 */

import type {
  TemplateRegistryEntry,
  CFCapability,
  TemplateQueryFilters,
  TemplateMatch,
} from "@foundation/shared";
import type { Env } from "../types";

/**
 * Query templates with optional filters
 */
export async function queryTemplates(
  env: Env,
  filters?: TemplateQueryFilters
): Promise<TemplateRegistryEntry[]> {
  let query = "SELECT * FROM template_registry WHERE 1=1";
  const params: unknown[] = [];

  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }

  if (filters?.framework) {
    query += " AND framework = ?";
    params.push(filters.framework);
  }

  if (filters?.maxComplexity) {
    query += " AND complexity <= ?";
    params.push(filters.maxComplexity);
  }

  if (filters?.maxCostMid) {
    query += " AND estimated_cost_mid <= ?";
    params.push(filters.maxCostMid);
  }

  if (filters?.source) {
    query += " AND source = ?";
    params.push(filters.source);
  }

  if (!filters?.includeDeprecated) {
    query += " AND deprecated = 0";
  }

  query += " ORDER BY complexity ASC, estimated_cost_mid ASC";

  const result = await env.DB.prepare(query).bind(...params).all();
  return (result.results || []).map(mapRowToTemplate);
}

/**
 * Get a single template by slug
 */
export async function getTemplateBySlug(
  env: Env,
  slug: string
): Promise<TemplateRegistryEntry | null> {
  const result = await env.DB.prepare(
    "SELECT * FROM template_registry WHERE slug = ?"
  ).bind(slug).first();

  return result ? mapRowToTemplate(result) : null;
}

/**
 * Get all CF capabilities
 */
export async function getAllCapabilities(env: Env): Promise<CFCapability[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM cf_capabilities ORDER BY name ASC"
  ).all();

  return (result.results || []).map(mapRowToCapability);
}

/**
 * Get capabilities with free tier
 */
export async function getFreeCapabilities(env: Env): Promise<CFCapability[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM cf_capabilities WHERE has_free_quota = 1 ORDER BY name ASC"
  ).all();

  return (result.results || []).map(mapRowToCapability);
}

/**
 * Get capability by slug
 */
export async function getCapabilityBySlug(
  env: Env,
  slug: string
): Promise<CFCapability | null> {
  const result = await env.DB.prepare(
    "SELECT * FROM cf_capabilities WHERE slug = ?"
  ).bind(slug).first();

  return result ? mapRowToCapability(result) : null;
}

/**
 * Score templates against research output
 */
export function scoreTemplates(
  templates: TemplateRegistryEntry[],
  requirements: {
    needsDatabase: boolean;
    needsRealtime: boolean;
    needsAI: boolean;
    needsAuth: boolean;
    maxBudget?: number;
    preferredFramework?: string;
  }
): TemplateMatch[] {
  return templates.map((template) => {
    let score = 50; // Base score
    const matchReasons: string[] = [];

    // Check for required features
    const bindings = template.bindings;

    if (requirements.needsDatabase && bindings.includes("d1_databases")) {
      score += 15;
      matchReasons.push("Has D1 database support");
    }

    if (requirements.needsRealtime && bindings.includes("durable_objects")) {
      score += 15;
      matchReasons.push("Has Durable Objects for real-time");
    }

    if (requirements.needsAI && (bindings.includes("ai") || bindings.includes("vectorize"))) {
      score += 15;
      matchReasons.push("Has AI/Vectorize support");
    }

    // Cost fit
    if (requirements.maxBudget && template.estimatedCostMid <= requirements.maxBudget) {
      score += 10;
      matchReasons.push(`Within budget ($${template.estimatedCostMid}/mo)`);
    }

    // Framework preference
    if (requirements.preferredFramework && template.framework === requirements.preferredFramework) {
      score += 10;
      matchReasons.push(`Uses preferred framework: ${template.framework}`);
    }

    // Penalize complexity
    score -= (template.complexity - 1) * 3;

    return {
      template,
      score: Math.max(0, Math.min(100, score)),
      matchReasons,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Format templates for LLM context injection
 */
export function formatTemplatesForContext(templates: TemplateRegistryEntry[]): string {
  if (templates.length === 0) return "No templates available.";

  return templates.map((t) =>
    `- **${t.name}** (\`${t.slug}\`): ${t.description}
   Framework: ${t.framework}, Complexity: ${t.complexity}/5, Cost: $${t.estimatedCostMid}/mo
   Bindings: ${t.bindings.join(", ") || "none"}`
  ).join("\n\n");
}

/**
 * Format capabilities for LLM context injection
 */
export function formatCapabilitiesForContext(capabilities: CFCapability[]): string {
  if (capabilities.length === 0) return "No capabilities available.";

  return capabilities.map((c) =>
    `- **${c.name}** (\`${c.slug}\`): ${c.description}
   Free: ${c.hasFreeQuota ? c.freeQuota : "No"}, Pricing: ${c.paidPricing || "N/A"}
   Best for: ${c.bestFor.join(", ")}`
  ).join("\n\n");
}

/**
 * Format free wins for LLM context injection
 */
export function formatFreeWinsForContext(capabilities: CFCapability[]): string {
  const freeOnes = capabilities.filter((c) => c.hasFreeQuota);
  if (freeOnes.length === 0) return "No free capabilities available.";

  return freeOnes.map((c) =>
    `- **${c.name}**: ${c.freeQuota} - ${c.bestFor[0] || "General use"}`
  ).join("\n");
}

// Helper: Map D1 row to TemplateRegistryEntry
function mapRowToTemplate(row: Record<string, unknown>): TemplateRegistryEntry {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    source: row.source as "cloudflare" | "bible" | "community",
    category: row.category as TemplateRegistryEntry["category"],
    framework: row.framework as TemplateRegistryEntry["framework"],
    bindings: parseJSON(row.bindings, []),
    complexity: Number(row.complexity) as 1 | 2 | 3 | 4 | 5,
    estimatedCostLow: Number(row.estimated_cost_low),
    estimatedCostMid: Number(row.estimated_cost_mid),
    estimatedCostHigh: Number(row.estimated_cost_high),
    repoUrl: row.repo_url ? String(row.repo_url) : undefined,
    docsUrl: row.docs_url ? String(row.docs_url) : undefined,
    lastScanned: row.last_scanned ? String(row.last_scanned) : undefined,
    deprecated: Boolean(row.deprecated),
    tags: parseJSON(row.tags, []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// Helper: Map D1 row to CFCapability
function mapRowToCapability(row: Record<string, unknown>): CFCapability {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    bindingType: row.binding_type as CFCapability["bindingType"],
    hasFreeQuota: Boolean(row.has_free_quota),
    freeQuota: row.free_quota ? String(row.free_quota) : undefined,
    paidPricing: row.paid_pricing ? String(row.paid_pricing) : undefined,
    bestFor: parseJSON(row.best_for, []),
    limitations: parseJSON(row.limitations, []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// Helper: Parse JSON safely
function parseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

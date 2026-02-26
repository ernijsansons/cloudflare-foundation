/**
 * Template Registry Types — Project Factory v3.0
 *
 * Types for the D1-backed template registry containing Cloudflare templates
 * and BIBLE agent patterns.
 */

/**
 * Template source origin
 */
export type TemplateSource = "cloudflare" | "bible" | "community";

/**
 * Template category
 */
export type TemplateCategory =
  | "fullstack"
  | "api"
  | "static"
  | "ai-agent"
  | "database"
  | "storage"
  | "realtime"
  | "auth"
  | "ecommerce"
  | "workflow";

/**
 * Frontend framework
 */
export type Framework =
  | "react"
  | "react-router"
  | "vue"
  | "svelte"
  | "astro"
  | "hono"
  | "none";

/**
 * Cloudflare binding type for wrangler config
 */
export type BindingType =
  | "d1_databases"
  | "kv_namespaces"
  | "r2_buckets"
  | "durable_objects"
  | "queues"
  | "workflows"
  | "vectorize"
  | "ai"
  | "ai_gateway"
  | "analytics_engine_datasets"
  | "hyperdrive"
  | "browser"
  | "containers"
  | "images";

/**
 * Template metadata stored in D1
 */
export interface TemplateRegistryEntry {
  id: string;                        // UUID
  slug: string;                      // Unique identifier, e.g., "cf-hono-api"
  name: string;                      // Human-readable name
  description: string;
  source: TemplateSource;
  category: TemplateCategory;
  framework: Framework;
  bindings: BindingType[];           // Required CF bindings
  complexity: 1 | 2 | 3 | 4 | 5;     // 1=trivial, 5=complex
  estimatedCostLow: number;          // $/mo at bootstrap
  estimatedCostMid: number;          // $/mo at growth
  estimatedCostHigh: number;         // $/mo at scale
  repoUrl?: string;                  // GitHub URL
  docsUrl?: string;                  // Documentation URL
  lastScanned?: string;              // ISO timestamp
  deprecated: boolean;
  tags: string[];                    // Searchable tags
  createdAt: string;
  updatedAt: string;
}

/**
 * CF Capability (product) with pricing info
 */
export interface CFCapability {
  id: string;                        // UUID
  slug: string;                      // e.g., "d1", "r2", "workers-ai"
  name: string;                      // e.g., "D1 Database"
  description: string;
  bindingType: BindingType;
  hasFreeQuota: boolean;
  freeQuota?: string;                // e.g., "5M reads/day"
  paidPricing?: string;              // e.g., "$0.75/M reads"
  bestFor: string[];                 // Use cases
  limitations?: string[];            // Known limitations
  createdAt: string;
  updatedAt: string;
}

/**
 * Query filters for template search
 */
export interface TemplateQueryFilters {
  category?: TemplateCategory;
  framework?: Framework;
  maxComplexity?: number;
  maxCostMid?: number;
  source?: TemplateSource;
  tags?: string[];
  includeDeprecated?: boolean;
}

/**
 * Template match result with scoring
 */
export interface TemplateMatch {
  template: TemplateRegistryEntry;
  score: number;                     // 0-100 relevance score
  matchReasons: string[];            // Why it matched
}

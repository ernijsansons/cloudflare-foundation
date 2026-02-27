/**
 * BuildSpec — Contract between Architecture Advisor and Scaffold Generator
 *
 * Project Factory v3.0
 */

/**
 * Cloudflare service binding specification
 */
export interface CFBinding {
	name: string; // e.g., "DB", "KV", "R2", etc.
	type: string; // e.g., "d1_databases", "kv_namespaces", "r2_buckets"
	resource?: string; // e.g., database name, KV namespace name
}

/**
 * Cost estimation for a template at different scale levels
 */
export interface CostEstimate {
	bootstrap: number; // $0-20/mo - MVP, first users
	growth: number; // $20-100/mo - product-market fit
	scale: number; // $100+/mo - growing user base
	notes?: string; // Pricing caveats
}

/**
 * Motion design tier for frontend quality
 */
export type MotionTier = 'none' | 'basic' | 'premium' | 'linear-grade';

/**
 * Template recommendation with scoring
 */
export interface TemplateRecommendation {
	slug: string; // Template identifier
	name: string; // Human-readable name
	score: number; // 0-100 match score
	reasoning: string; // Why this template fits
	bindings: CFBinding[]; // Required CF bindings
	estimatedCost: CostEstimate; // Monthly cost estimate
	motionTier: MotionTier; // Frontend animation tier
	complexity: 1 | 2 | 3 | 4 | 5; // Implementation complexity
	tradeoffs: string[]; // Known tradeoffs/limitations
}

/**
 * API route specification
 */
export interface ApiRoute {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	path: string; // e.g., "/api/users/:id"
	description: string;
	auth: 'none' | 'session' | 'api-key' | 'tenant';
	rateLimit?: string; // e.g., "100/min"
}

/**
 * Database table specification
 */
export interface DataTable {
	name: string; // snake_case table name
	description: string;
	columns: Array<{
		name: string;
		type: string; // SQLite type
		nullable: boolean;
		indexed?: boolean;
		unique?: boolean;
		foreignKey?: string; // e.g., "users.id"
	}>;
}

/**
 * Data model specification
 */
export interface BuildSpecDataModel {
	tables: DataTable[];
	indexes: string[]; // Index definitions
	migrations: string[]; // Migration filenames
}

/**
 * Frontend specification
 */
export interface FrontendSpec {
	framework: string; // e.g., "react-router", "svelte", "astro"
	pages: string[]; // Route paths
	components: string[]; // Key components to generate
	motionTier: MotionTier;
	styling: 'tailwind' | 'css' | 'styled-components';
}

/**
 * Agent specification for Durable Objects
 */
export interface AgentSpec {
	name: string; // DO class name
	type: 'chat' | 'task' | 'session' | 'custom';
	state: string[]; // State keys
	tools?: string[]; // MCP tools
	hibernation: boolean;
}

/**
 * Growth path from current template to more capable one
 */
export interface GrowthPath {
	fromTemplate: string;
	toTemplate: string;
	trigger: string; // When to upgrade
	effort: 'low' | 'medium' | 'high';
	steps: string[];
}

/**
 * Complete BuildSpec — output of Architecture Advisor
 */
export interface BuildSpec {
	id: string; // UUID
	runId: string; // Planning run ID

	// Template recommendations (ranked)
	recommended: TemplateRecommendation;
	alternatives: TemplateRecommendation[];

	// Architecture details
	dataModel: BuildSpecDataModel;
	apiRoutes: ApiRoute[];
	frontend: FrontendSpec | null;
	agents: AgentSpec[];
	freeWins: FreeWin[]; // Free CF products (Turnstile, Analytics, etc.)

	// Growth planning
	growthPath: GrowthPath | null;

	// Scaffold command
	scaffoldCommand: string; // e.g., "npm create cloudflare@latest -- --template=..."

	// Cost summary
	totalEstimatedMonthlyCost: CostEstimate;

	// Metadata
	// 'fallback' indicates the BuildSpec was generated using fallback logic
	// due to LLM failure (not a high-quality recommendation)
	status: 'draft' | 'approved' | 'rejected' | 'fallback';
	approvedBy?: string;
	approvedAt?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Free Cloudflare capability that adds value
 */
export interface FreeWin {
	capability: string; // e.g., "turnstile", "analytics-engine"
	benefit: string; // Why to add it
	effort: 'trivial' | 'easy' | 'moderate';
	freeQuota: string; // e.g., "unlimited", "25M events/mo"
}

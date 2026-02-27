/**
 * Factory UI Type Definitions
 *
 * Types for the Project Factory v3.0 UI components
 */

export interface Template {
	slug: string;
	name: string;
	description: string;
	category: 'workers' | 'pages' | 'apis' | 'agents' | 'full-stack';
	framework: string;
	source: 'cloudflare' | 'bible' | 'community' | 'custom';
	complexity: 'low' | 'medium' | 'high';
	cost_low: number;
	cost_mid: number;
	cost_high: number;
	bindings: string[];
	tags: string[];
	tradeoffs: string[];
	best_for: string;
	c3_command: string | null;
	cost_notes: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Capability {
	slug: string;
	name: string;
	description: string;
	binding_type: string | null;
	has_free_quota: boolean;
	free_quota: string | null;
	paid_pricing: string | null;
	best_for: string;
	limitations: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface RequiredBinding {
	type: string;
	name: string;
	purpose: string;
}

export interface AlternativeTemplate {
	label: string;
	template: {
		slug: string;
		name: string;
	};
	match_score: number;
	why_consider: string;
}

export interface ApiRoute {
	method: string;
	path: string;
	auth: string;
	description: string;
}

export interface FreeWin {
	product: string;
	free_quota: string;
	value_prop: string;
}

export interface BuildSpec {
	id: string;
	run_id: string;
	recommended: {
		label: string;
		template: {
			slug: string;
			source: string;
			name: string;
			framework: string;
			rationale: string;
			c3Command?: string;
		};
		bindings: {
			required: RequiredBinding[];
			recommended: RequiredBinding[];
			optional: RequiredBinding[];
		};
		estimated_monthly_cost: { low: number; mid: number; high: number };
		complexity: number;
		time_to_ship: string;
		tradeoffs: string[];
		free_wins: string[];
	};
	alternatives: AlternativeTemplate[];
	data_model: {
		tables: unknown[];
		orm: string;
		migration_strategy: string;
	};
	api_routes: ApiRoute[];
	frontend: {
		framework: string;
		router: string;
		ssr: boolean;
		motion_design_tier: string;
		ui_library: string;
		animation_library: string;
	};
	agents: {
		pattern: string;
		durable_objects: unknown[];
		mcp_server: boolean;
		mcp_tools: unknown[];
		has_chat: boolean;
		has_task_queue: boolean;
	};
	free_wins: FreeWin[];
	growth_path: {
		phase2_additions: string[];
		migration_notes: string[];
	};
	scaffold_command: string;
	total_estimated_monthly_cost: {
		bootstrap: number;
		growth: number;
		scale: number;
	};
	status: 'draft' | 'approved' | 'rejected' | 'fallback' | 'active' | 'archived';
	created_at: string;
	updated_at: string;
}

/**
 * Factory data transformers — shared API contract to UI contract conversion.
 */

import type {
	ApiRoute as SharedApiRoute,
	BuildSpec as SharedBuildSpec,
	CFCapability as SharedCapability,
	FreeWin as SharedFreeWin,
	TemplateRecommendation as SharedTemplateRecommendation,
	TemplateRegistryEntry as SharedTemplate
} from '@foundation/shared';

import type {
	AlternativeTemplate,
	ApiRoute as UIApiRoute,
	BuildSpec as UIBuildSpec,
	Capability as UICapability,
	FreeWin as UIFreeWin,
	RequiredBinding,
	Template as UITemplate
} from '../types/factory';

/**
 * Transform API BuildSpec (camelCase) to UI BuildSpec (snake_case).
 */
export function transformBuildSpec(api: SharedBuildSpec): UIBuildSpec {
	return {
		id: api.id,
		run_id: api.runId,
		recommended: transformRecommendation(api.recommended, api.freeWins),
		alternatives: api.alternatives.map(transformAlternative),
		data_model: {
			tables: api.dataModel.tables,
			orm: 'drizzle',
			migration_strategy: 'versioned'
		},
		api_routes: api.apiRoutes.map(transformApiRoute),
		frontend: api.frontend
			? {
					framework: api.frontend.framework,
					router: api.frontend.framework,
					ssr: api.frontend.framework !== 'astro',
					motion_design_tier: api.frontend.motionTier,
					ui_library: 'shadcn-ui',
					animation_library: api.frontend.motionTier === 'none' ? 'none' : 'motion'
				}
			: {
					framework: 'none',
					router: 'none',
					ssr: false,
					motion_design_tier: 'none',
					ui_library: 'none',
					animation_library: 'none'
				},
		agents: {
			pattern: api.agents.length > 0 ? 'durable-objects' : 'none',
			durable_objects: api.agents.map((agent) => ({
				name: agent.name,
				type: agent.type,
				hibernation: agent.hibernation
			})),
			mcp_server: api.agents.some((agent) => (agent.tools ?? []).length > 0),
			mcp_tools: api.agents.flatMap((agent) => agent.tools ?? []),
			has_chat: api.agents.some((agent) => agent.type === 'chat'),
			has_task_queue: api.agents.some((agent) => agent.type === 'task')
		},
		free_wins: api.freeWins.map(transformFreeWin),
		growth_path: api.growthPath
			? {
					phase2_additions: api.growthPath.steps,
					migration_notes: [
						`Upgrade from ${api.growthPath.fromTemplate} to ${api.growthPath.toTemplate}`,
						`Trigger: ${api.growthPath.trigger}`,
						`Effort: ${api.growthPath.effort}`
					]
				}
			: {
					phase2_additions: [],
					migration_notes: []
				},
		scaffold_command: api.scaffoldCommand,
		total_estimated_monthly_cost: {
			bootstrap: api.totalEstimatedMonthlyCost.bootstrap,
			growth: api.totalEstimatedMonthlyCost.growth,
			scale: api.totalEstimatedMonthlyCost.scale
		},
		status: api.status,
		created_at: api.createdAt,
		updated_at: api.updatedAt
	};
}

/**
 * Transform shared template registry entry to UI template model.
 */
export function transformTemplate(api: SharedTemplate): UITemplate {
	return {
		slug: api.slug,
		name: api.name,
		description: api.description,
		category: mapTemplateCategory(api.category),
		framework: api.framework,
		source: api.source,
		complexity: mapTemplateComplexity(api.complexity),
		cost_low: api.estimatedCostLow,
		cost_mid: api.estimatedCostMid,
		cost_high: api.estimatedCostHigh,
		bindings: api.bindings,
		tags: api.tags,
		tradeoffs: [],
		best_for: api.tags[0] ?? 'General-purpose template',
		c3_command: `npm create cloudflare@latest -- --template=${api.slug}`,
		cost_notes: api.costNotes ?? null,
		is_active: !api.deprecated,
		created_at: api.createdAt,
		updated_at: api.updatedAt
	};
}

/**
 * Transform shared Cloudflare capability entry to UI capability model.
 */
export function transformCapability(api: SharedCapability): UICapability {
	return {
		slug: api.slug,
		name: api.name,
		description: api.description,
		binding_type: api.bindingType,
		has_free_quota: api.hasFreeQuota,
		free_quota: api.freeQuota ?? null,
		paid_pricing: api.paidPricing ?? null,
		best_for: api.bestFor.join(', '),
		limitations: api.limitations?.join(', ') ?? null,
		is_active: true,
		created_at: api.createdAt,
		updated_at: api.updatedAt
	};
}

function transformRecommendation(
	recommendation: SharedTemplateRecommendation,
	freeWins: SharedFreeWin[]
): UIBuildSpec['recommended'] {
	const requiredTypes = ['d1_databases', 'kv_namespaces'];
	const recommendedTypes = ['r2_buckets', 'queues', 'durable_objects'];

	const required: RequiredBinding[] = recommendation.bindings
		.filter((binding) => requiredTypes.includes(binding.type))
		.map((binding) => ({
			type: binding.type,
			name: binding.name,
			purpose: binding.resource || `${binding.type} binding`
		}));

	const recommended: RequiredBinding[] = recommendation.bindings
		.filter((binding) => recommendedTypes.includes(binding.type))
		.map((binding) => ({
			type: binding.type,
			name: binding.name,
			purpose: binding.resource || `${binding.type} binding`
		}));

	const optional: RequiredBinding[] = recommendation.bindings
		.filter(
			(binding) => !requiredTypes.includes(binding.type) && !recommendedTypes.includes(binding.type)
		)
		.map((binding) => ({
			type: binding.type,
			name: binding.name,
			purpose: binding.resource || `${binding.type} binding`
		}));

	return {
		label: recommendation.slug,
		template: {
			slug: recommendation.slug,
			source: 'cloudflare',
			name: recommendation.name,
			framework: extractFramework(recommendation.slug),
			rationale: recommendation.reasoning,
			c3Command: `npm create cloudflare@latest -- --template=${recommendation.slug}`
		},
		bindings: { required, recommended, optional },
		estimated_monthly_cost: {
			low: recommendation.estimatedCost.bootstrap,
			mid: recommendation.estimatedCost.growth,
			high: recommendation.estimatedCost.scale
		},
		complexity: recommendation.complexity,
		time_to_ship: complexityToTimeEstimate(recommendation.complexity),
		tradeoffs: recommendation.tradeoffs,
		free_wins: freeWins.map((freeWin) => freeWin.capability)
	};
}

function transformAlternative(recommendation: SharedTemplateRecommendation): AlternativeTemplate {
	return {
		label: recommendation.slug,
		template: {
			slug: recommendation.slug,
			name: recommendation.name
		},
		match_score: recommendation.score,
		why_consider: recommendation.reasoning
	};
}

function transformFreeWin(freeWin: SharedFreeWin): UIFreeWin {
	return {
		product: freeWin.capability,
		free_quota: freeWin.freeQuota,
		value_prop: freeWin.benefit
	};
}

function transformApiRoute(route: SharedApiRoute): UIApiRoute {
	return {
		method: route.method,
		path: route.path,
		auth: route.auth,
		description: route.description
	};
}

function mapTemplateCategory(category: SharedTemplate['category']): UITemplate['category'] {
	switch (category) {
		case 'api':
			return 'apis';
		case 'static':
			return 'pages';
		case 'ai-agent':
			return 'agents';
		case 'fullstack':
			return 'full-stack';
		default:
			return 'workers';
	}
}

function mapTemplateComplexity(complexity: number): UITemplate['complexity'] {
	if (complexity <= 2) {
		return 'low';
	}
	if (complexity === 3) {
		return 'medium';
	}
	return 'high';
}

function extractFramework(slug: string): string {
	if (slug.includes('react')) return 'react-router';
	if (slug.includes('svelte')) return 'sveltekit';
	if (slug.includes('vue')) return 'vue';
	if (slug.includes('astro')) return 'astro';
	if (slug.includes('hono')) return 'hono';
	if (slug.includes('next')) return 'next.js';
	return 'workers';
}

function complexityToTimeEstimate(complexity: 1 | 2 | 3 | 4 | 5): string {
	const estimates: Record<number, string> = {
		1: '1-2 days',
		2: '3-5 days',
		3: '1-2 weeks',
		4: '2-4 weeks',
		5: '1-2 months'
	};
	return estimates[complexity] || '1-2 weeks';
}

/**
 * Architecture Advisor Agent — Post-Pipeline Phase
 *
 * Reads research output from the 18-phase planning pipeline and recommends
 * the optimal Cloudflare architecture by querying the Template Registry
 * and CF Capabilities database.
 *
 * Part of Project Factory v3.0
 *
 * Key responsibilities:
 * 1. Analyze prior phase outputs (tech-arch, product-design, business-model, kill-test)
 * 2. Query template registry for matching templates
 * 3. Query CF capabilities for free wins and cost estimation
 * 4. Produce ranked BuildSpec recommendations
 */

import type { BuildSpec } from '@foundation/shared';

import { mapToBuildSpec } from '../lib/build-spec-mapper';
import { extractJSON } from '../lib/json-extractor';
import { runModel } from '../lib/model-router';
import {
	queryTemplates,
	getAllCapabilities,
	getFreeCapabilities,
	formatTemplatesForContext,
	formatCapabilitiesForContext,
	formatFreeWinsForContext,
	scoreTemplates
} from '../lib/template-registry';
import { ArchitectureAdvisorOutputSchema } from '../schemas/architecture-advisor';

import { BaseAgent, type AgentContext, type AgentResult, type BaseAgentConfig } from './base-agent';

interface ArchitectureAdvisorInput {
	idea: string;
	refinedIdea?: string;
}

export class ArchitectureAdvisorAgent extends BaseAgent<ArchitectureAdvisorInput, BuildSpec> {
	config: BaseAgentConfig = {
		phase: 'architecture-advisor',
		maxSelfIterations: 2,
		qualityThreshold: 8,
		hardQuestions: [
			"Does the recommended template actually match the idea's needs?",
			'Are the cost estimates realistic based on CF pricing?',
			'Have you considered ALL free Cloudflare products that could add value?',
			'Is the complexity level appropriate for the team size and timeline?',
			'Could a simpler template work for the MVP?',
			'Are the Motion design tier and UI choices justified by the revenue model?',
			'Have you avoided over-engineering for a landing page / simple app?',
			'Is this truly the OPTIMAL stack, not just a familiar one?'
		],
		maxTokens: 8192,
		includeFoundationContext: false // We inject our own context with registry data
	};

	getSystemPrompt(): string {
		return `You are the Architecture Advisor for a Cloudflare project factory. Your job is to analyze research output from an 18-phase planning pipeline and recommend the OPTIMAL Cloudflare architecture.

You have access to:
1. A Template Registry of 22+ official Cloudflare templates and 5 BIBLE agent patterns
2. A Capabilities Matrix of all Cloudflare products with pricing
3. Research output from prior phases (opportunity, kill-test, product-design, business-model, tech-arch)

YOUR CORE RESPONSIBILITY:
- DO NOT assume a fixed stack. Choose the BEST template and bindings for THIS specific idea.
- Produce 2-3 ranked Architecture Options with honest tradeoffs
- Suggest FREE Cloudflare products that add value ("free wins")
- Calculate realistic monthly cost estimates at bootstrap/growth/scale levels
- Choose the appropriate Motion design tier based on the product's revenue potential

DECISION FRAMEWORK:
- Landing page / blog / portfolio → Astro or Vite React (complexity 1, $0/mo)
- Simple SaaS / CRUD / dashboard → React Router + Hono + D1 (complexity 2, $5/mo)
- Full SaaS with agents → React Router + Hono + D1 + DO + Queues (complexity 3, $25/mo)
- Enterprise / Postgres / complex → React Router + Postgres + Hyperdrive + DO (complexity 4, $80/mo)
- Pure API / microservice / backend → Hono API only, no frontend (complexity 1-2, $0-5/mo)
- AI agent app → LLM Chat template + Agents SDK + Vectorize (complexity 3-4, $25-100/mo)

MOTION DESIGN TIER SELECTION:
- "none": API-only projects, no frontend
- "basic": Simple apps, MVPs, low-revenue ideas → CSS transitions only
- "premium": SaaS, moderate revenue potential → Motion library, spring physics, stagger
- "linear-grade": Flagship products, high revenue → Full Motion, gestures, glass morphism

FREE WINS TO ALWAYS CONSIDER (add when applicable):
- Turnstile (free, always): Bot protection on signup/contact forms
- Analytics Engine (25M events free): Product analytics without Mixpanel
- AI Gateway (free proxy): Cache LLM responses, save 40% on API costs
- R2 (10GB free): File uploads for $0
- Queues (1M messages free): Async processing
- Vectorize (5M queries free): Semantic search without Pinecone
- Workers Builds (6K minutes free): CI/CD without GitHub Actions

OUTPUT REQUIREMENTS:
1. "recommended": The best Architecture Option (template + bindings + cost + tradeoffs + free wins)
2. "alternatives": 1-2 alternative options at different complexity/cost levels
3. "dataModel": Database tables needed (if any D1 binding)
4. "apiRoutes": API endpoints needed
5. "frontend": Framework, Motion tier, UI library
6. "agents": Agent pattern needed (if any), DO classes, MCP tools
7. "scaffoldCommand": The C3 command to create the project
8. "totalEstimatedMonthlyCost": At bootstrap/growth/scale levels

Think carefully about what this idea ACTUALLY needs. Don't over-engineer a landing page. Don't under-engineer an enterprise SaaS.

Produce valid JSON matching the ArchitectureAdvisorOutput schema.`;
	}

	getOutputSchema(): Record<string, unknown> {
		return {
			recommended: {
				label: 'string',
				template: {
					slug: 'string',
					source: 'cloudflare|bible|community|custom',
					name: 'string',
					framework: 'string',
					rationale: 'string',
					c3Command: 'string (optional)'
				},
				bindings: {
					required: [{ type: 'string', name: 'string', purpose: 'string' }],
					recommended: [],
					optional: []
				},
				estimatedMonthlyCost: { low: 'number', mid: 'number', high: 'number' },
				complexity: '1-5',
				timeToShip: 'string',
				tradeoffs: ['string'],
				freeWins: ['string']
			},
			alternatives: [],
			dataModel: {
				tables: [],
				orm: 'drizzle|prisma|raw-sql',
				migrationStrategy: 'd1-migrations|drizzle-kit|manual'
			},
			apiRoutes: [
				{
					method: 'GET|POST|PUT|PATCH|DELETE',
					path: 'string',
					auth: 'required|optional|public',
					description: 'string'
				}
			],
			frontend: {
				framework: 'string',
				router: 'string',
				ssr: 'boolean',
				motionDesignTier: 'none|basic|premium|linear-grade',
				uiLibrary: 'shadcn|radix|custom|tailwind-only',
				animationLibrary: 'motion|css-only|none'
			},
			agents: {
				pattern: 'super-agent|lightweight|full-power|swarm|orchestration|none',
				durableObjects: [],
				mcpServer: 'boolean',
				mcpTools: [],
				hasChat: 'boolean',
				hasTaskQueue: 'boolean'
			},
			growthPath: {
				phase2Additions: ['string'],
				migrationNotes: ['string']
			},
			scaffoldCommand: 'string',
			totalEstimatedMonthlyCost: {
				bootstrap: 'number',
				growth: 'number',
				scale: 'number'
			},
			draftTasks: []
		};
	}

	getPhaseRubric(): string[] {
		return [
			'template_match — does the chosen template genuinely fit the idea?',
			'cost_accuracy — are monthly estimates based on real CF pricing?',
			'free_wins_coverage — have all applicable free products been suggested?',
			'complexity_calibration — is complexity right for team size + timeline?',
			'tradeoff_honesty — are tradeoffs between options clearly stated?',
			'motion_tier_justification — is the UI investment justified by revenue potential?'
		];
	}

	async run(ctx: AgentContext, _input: ArchitectureAdvisorInput): Promise<AgentResult<BuildSpec>> {
		// 1. Load template registry and capabilities from D1
		let templates, capabilities, freeCapabilities;
		try {
			[templates, capabilities, freeCapabilities] = await Promise.all([
				queryTemplates(this.env, {}), // All active templates
				getAllCapabilities(this.env), // All CF products
				getFreeCapabilities(this.env) // Free products for suggestions
			]);
		} catch (dbError) {
			console.error('[ArchitectureAdvisorAgent] Failed to query registry:', dbError);
			// Return a fallback result with sensible defaults
			return {
				success: false,
				errors: [
					`Database query failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
					'Ensure template_registry and cf_capabilities tables exist and are seeded.'
				]
			};
		}

		// 2. Pre-score templates algorithmically
		const requirements = this.extractRequirements(ctx.priorOutputs);
		const scoredTemplates = scoreTemplates(templates, requirements);
		const topTemplate = scoredTemplates[0]; // Highest scoring

		// 3. Build context with registry data + prior research + algorithmic scores
		const registryContext = `
## Available Templates (${templates.length} total)
${formatTemplatesForContext(templates)}

## Pre-Scored Recommendations (Algorithmic)
Top Match: ${topTemplate?.template.name || 'N/A'} (score: ${topTemplate?.score || 0}/100)
Reasons: ${topTemplate?.matchReasons.join(', ') || 'N/A'}
Alternative: ${scoredTemplates[1]?.template.name || 'N/A'} (score: ${scoredTemplates[1]?.score || 0}/100)

## Cloudflare Capabilities (${capabilities.length} products)
${formatCapabilitiesForContext(capabilities)}

## Free Products (suggest as "free wins")
${formatFreeWinsForContext(freeCapabilities)}
`;

		// 4. Extract key insights from prior phases
		const priorInsights = this.extractPriorInsights(ctx.priorOutputs);

		// 5. Build the user prompt
		const userPrompt = `Analyze the following idea and research output. Recommend the optimal Cloudflare architecture.

## Idea
${ctx.idea}
${ctx.refinedIdea ? `\nRefined opportunity: ${ctx.refinedIdea}` : ''}

## Research Insights from Prior Phases
${priorInsights}

## Instructions
Based on the templates and capabilities available, recommend:

1. The BEST template for this idea (consider complexity, cost, features needed)
2. Which CF bindings are required vs. optional
3. Which FREE products should be added as "free wins"
4. Realistic monthly cost estimates at bootstrap/growth/scale
5. The appropriate Motion design tier based on revenue potential
6. 1-2 alternative options at different complexity levels

Think carefully:
- Is this a simple landing page or a complex SaaS?
- Does it need agents/AI or just CRUD?
- What's the revenue model? Does it justify "linear-grade" motion?
- Could a simpler template work for MVP?

Output valid JSON matching the schema. Include honest tradeoffs.`;

		// 6. Run the model
		const systemPrompt = this.getSystemPrompt() + '\n\n' + registryContext;

		const messages = [
			{ role: 'system' as const, content: systemPrompt },
			{ role: 'user' as const, content: userPrompt }
		];

		try {
			const response = await runModel(this.env.AI, 'generator', messages, {
				temperature: 0.3, // Lower temperature for more deterministic recommendations
				maxTokens: this.config.maxTokens ?? 8192
			});

			const parsed = extractJSON(response);
			const agentOutput = ArchitectureAdvisorOutputSchema.parse(parsed);

			// 7. Enhance LLM output with algorithmic insights
			// Fill missing recommended if LLM didn't provide
			if (!agentOutput.recommended && topTemplate) {
				agentOutput.recommended = {
					slug: topTemplate.template.slug,
					name: topTemplate.template.name,
					score: topTemplate.score,
					reasoning: `Best match based on requirements (${topTemplate.score}/100). ${topTemplate.matchReasons.join(', ')}`,
					bindings: [],
					estimatedCost: {
						bootstrap: topTemplate.template.estimatedCostLow,
						growth: topTemplate.template.estimatedCostMid,
						scale: topTemplate.template.estimatedCostHigh
					},
					motionTier: 'basic',
					complexity: topTemplate.template.complexity,
					tradeoffs: []
				};
			}

			// Add alternatives if LLM didn't provide enough
			if ((!agentOutput.alternatives || agentOutput.alternatives.length < 2) && scoredTemplates.length > 1) {
				const existingAlternatives = agentOutput.alternatives || [];
				const neededCount = 2 - existingAlternatives.length;
				const additionalAlternatives = scoredTemplates.slice(1, 1 + neededCount).map((match) => ({
					slug: match.template.slug,
					name: match.template.name,
					score: match.score,
					reasoning: match.matchReasons.join(', '),
					bindings: [],
					estimatedCost: {
						bootstrap: match.template.estimatedCostLow,
						growth: match.template.estimatedCostMid,
						scale: match.template.estimatedCostHigh
					},
					motionTier: 'basic' as const,
					complexity: match.template.complexity,
					tradeoffs: []
				}));
				agentOutput.alternatives = [...existingAlternatives, ...additionalAlternatives];
			}

			// Add scaffold command if not present
			if (!agentOutput.scaffoldCommand && agentOutput.recommended?.slug) {
				agentOutput.scaffoldCommand = `npm create cloudflare@latest -- --template=${agentOutput.recommended.slug}`;
			}

			// Transform to BuildSpec with metadata (id, runId, status, timestamps)
			const buildSpec = mapToBuildSpec(agentOutput, ctx.runId);

			return { success: true, output: buildSpec };
		} catch (e) {
			console.error('[ArchitectureAdvisorAgent] LLM failed, using fallback:', e);
			const fallbackSpec = this.getFallbackBuildSpec(ctx.runId);
			// Mark as fallback status so downstream consumers can detect degraded output
			fallbackSpec.status = 'fallback';
			return {
				success: true,
				output: fallbackSpec,
				warnings: ['Generated using fallback stack due to LLM failure. Recommendations may not match your actual requirements.'],
				errors: [`LLM failed: ${e instanceof Error ? e.message : String(e)}`]
			};
		}
	}

	/**
	 * Extract key insights from prior phase outputs for context
	 */
	private extractPriorInsights(priorOutputs: Record<string, unknown>): string {
		const insights: string[] = [];

		// Kill-test decision
		const killTest = priorOutputs['kill-test'] as Record<string, unknown> | undefined;
		if (killTest) {
			insights.push(`**Kill-test decision**: ${killTest.decision || 'CONTINUE'}`);
			if (killTest.risks) {
				insights.push(`**Top risks**: ${JSON.stringify(killTest.risks)}`);
			}
		}

		// Business model
		const businessModel = priorOutputs['business-model'] as Record<string, unknown> | undefined;
		if (businessModel) {
			const revenue = businessModel.revenueModel || businessModel.revenue_model;
			if (revenue) {
				insights.push(`**Revenue model**: ${JSON.stringify(revenue)}`);
			}
			const unitEconomics = businessModel.unitEconomics || businessModel.unit_economics;
			if (unitEconomics) {
				insights.push(`**Unit economics**: ${JSON.stringify(unitEconomics)}`);
			}
		}

		// Product design
		const productDesign = priorOutputs['product-design'] as Record<string, unknown> | undefined;
		if (productDesign) {
			const features = productDesign.features || productDesign.coreFeatures;
			if (features) {
				insights.push(
					`**Core features**: ${Array.isArray(features) ? features.slice(0, 5).join(', ') : JSON.stringify(features)}`
				);
			}
			const userJourney = productDesign.userJourney || productDesign.user_journey;
			if (userJourney) {
				insights.push(`**User journey**: ${JSON.stringify(userJourney)}`);
			}
		}

		// Tech arch (existing technical decisions)
		const techArch = priorOutputs['tech-arch'] as Record<string, unknown> | undefined;
		if (techArch) {
			const bindings = techArch.cloudflareBindings;
			if (bindings) {
				insights.push(`**Tech-arch suggested bindings**: ${JSON.stringify(bindings)}`);
			}
			const database = techArch.databaseSchema;
			if (database) {
				insights.push(`**Tech-arch database schema**: ${JSON.stringify(database)}`);
			}
		}

		// Opportunity analysis
		const opportunity = priorOutputs['opportunity'] as Record<string, unknown> | undefined;
		if (opportunity) {
			const recommended = opportunity.recommendedIndex;
			const opportunities = opportunity.refinedOpportunities as
				| Array<Record<string, unknown>>
				| undefined;
			if (opportunities && typeof recommended === 'number' && opportunities[recommended]) {
				const best = opportunities[recommended];
				insights.push(
					`**Selected opportunity**: ${best.idea || best.name} - ${best.description || ''}`
				);
				insights.push(`**Revenue potential**: ${best.revenuePotential || 'UNKNOWN'}`);
				insights.push(`**Agentic score**: ${best.agenticScore || 'UNKNOWN'}`);
			}
		}

		if (insights.length === 0) {
			return 'No prior phase outputs available. Analyze based on the idea alone.';
		}

		return insights.join('\n');
	}

	/**
	 * Extract requirements from prior phase outputs for algorithmic scoring
	 */
	private extractRequirements(priorOutputs: Record<string, unknown>) {
		const productDesign = priorOutputs['product-design'] as Record<string, unknown> | undefined;
		const businessModel = priorOutputs['business-model'] as Record<string, unknown> | undefined;
		const techArch = priorOutputs['tech-arch'] as Record<string, unknown> | undefined;

		const featuresText = JSON.stringify(productDesign?.features || '').toLowerCase();

		return {
			needsDatabase: /database|persist|store|crud|d1/.test(featuresText),
			needsRealtime: /real-time|websocket|live|chat|collaboration/.test(featuresText),
			needsAI: /ai|llm|semantic|agent|embedding|vectorize/.test(featuresText),
			needsAuth: /auth|login|signup|user|account/.test(featuresText),
			maxBudget: businessModel?.maxBudget as number | undefined,
			preferredFramework: techArch?.preferredFramework as string | undefined
		};
	}

	/**
	 * Get fallback BuildSpec when LLM fails
	 */
	private getFallbackBuildSpec(runId: string): BuildSpec {
		return mapToBuildSpec(
			{
				recommended: {
					slug: 'react-router-hono',
					name: 'React Router with Hono API',
					score: 70,
					reasoning: 'Default safe stack (LLM unavailable). React Router for frontend, Hono for API, D1 for database.',
					bindings: [
						{ type: 'd1_databases', name: 'DB', resource: 'primary-db' }
					],
					estimatedCost: { bootstrap: 0, growth: 5, scale: 25 },
					motionTier: 'basic',
					complexity: 2,
					tradeoffs: ['Generic stack, may need customization', 'Limited to D1 database (no Postgres)']
				},
				alternatives: [],
				dataModel: {
					tables: [],
					indexes: [],
					migrations: ['0001_initial.sql']
				},
				apiRoutes: [],
				frontend: {
					framework: 'react-router',
					pages: ['/'],
					components: ['App', 'Layout'],
					motionTier: 'basic',
					styling: 'tailwind'
				},
				agents: [],
				freeWins: [],
				growthPath: null,
				scaffoldCommand: 'npm create cloudflare@latest -- --template=react-router',
				totalEstimatedMonthlyCost: { bootstrap: 0, growth: 5, scale: 25 }
			},
			runId
		);
	}
}

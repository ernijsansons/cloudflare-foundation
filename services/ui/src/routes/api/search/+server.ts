/**
 * Global Search API
 *
 * Searches runs/ideas via gateway and adds phase discoverability matches.
 * Does not return mock data in failure scenarios.
 */

import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import type { SearchResponse, SearchResult } from '$lib/types';

const PHASES = [
	'opportunity',
	'customer-intel',
	'market-research',
	'competitive-intel',
	'kill-test',
	'revenue-expansion',
	'strategy',
	'business-model',
	'product-design',
	'gtm-marketing',
	'content-engine',
	'tech-arch',
	'analytics',
	'launch-execution',
	'synthesis',
	'task-reconciliation',
	'diagram-generation',
	'validation'
] as const;

function normalizeList(payload: unknown, key: string): Array<Record<string, unknown>> {
	if (Array.isArray(payload)) {
		return payload as Array<Record<string, unknown>>;
	}

	if (payload && typeof payload === 'object') {
		const record = payload as Record<string, unknown>;
		if (Array.isArray(record[key])) {
			return record[key] as Array<Record<string, unknown>>;
		}
		if (Array.isArray(record.items)) {
			return record.items as Array<Record<string, unknown>>;
		}
	}

	return [];
}

function toStringValue(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export const GET: RequestHandler = async ({ url, fetch, locals, platform }) => {
	const query = url.searchParams.get('q') || '';
	const limitParam = Number.parseInt(url.searchParams.get('limit') || '20', 10);
	const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

	if (!query.trim()) {
		return json({
			results: [],
			total: 0,
			query: ''
		} satisfies SearchResponse);
	}

	const startTime = Date.now();
	const normalizedQuery = query.toLowerCase().trim();
	const gateway = createGatewayClient(platform, locals, fetch);

	const [runsResult, ideasResult] = await Promise.allSettled([
		gateway.fetchJson<unknown>('/api/planning/runs?limit=50'),
		gateway.fetchJson<unknown>('/api/planning/ideas?limit=50')
	]);

	const results: SearchResult[] = [];

	if (runsResult.status === 'fulfilled') {
		const runs = normalizeList(runsResult.value, 'runs');
		for (const run of runs) {
			if (results.length >= limit) {
				break;
			}

			const runId = toStringValue(run.id);
			const idea = toStringValue(run.idea) || toStringValue(run.refined_idea);
			const currentPhase = toStringValue(run.current_phase);
			const status = toStringValue(run.status);
			const score = typeof run.quality_score === 'number' ? run.quality_score : undefined;
			const matches = runId.toLowerCase().includes(normalizedQuery) || idea.toLowerCase().includes(normalizedQuery);

			if (!matches || !runId) {
				continue;
			}

			results.push({
				type: 'run',
				id: runId,
				title: idea.slice(0, 100) || `Run ${runId.slice(0, 8)}`,
				subtitle: currentPhase ? `Phase: ${currentPhase}` : status ? `Status: ${status}` : undefined,
				href: `/ai-labs/research/runs/${runId}`,
				status: status || undefined,
				phase: (currentPhase || undefined) as SearchResult['phase'],
				score
			});
		}
	}

	if (ideasResult.status === 'fulfilled') {
		const ideas = normalizeList(ideasResult.value, 'ideas');
		for (const idea of ideas) {
			if (results.length >= limit) {
				break;
			}

			const ideaId = toStringValue(idea.id);
			const title = toStringValue(idea.title) || toStringValue(idea.idea);
			const status = toStringValue(idea.status);
			const matches =
				ideaId.toLowerCase().includes(normalizedQuery) || title.toLowerCase().includes(normalizedQuery);

			if (!matches || !ideaId) {
				continue;
			}

			results.push({
				type: 'idea',
				id: ideaId,
				title: title.slice(0, 100),
				subtitle: status ? `Status: ${status}` : undefined,
				href: `/ai-labs/idea/${ideaId}`,
				status: status || undefined
			});
		}
	}

	if (results.length < limit) {
		for (const phase of PHASES) {
			if (results.length >= limit) {
				break;
			}

			if (phase.includes(normalizedQuery.replace(/\s+/g, '-'))) {
				results.push({
					type: 'phase',
					id: phase,
					title: phase.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
					subtitle: 'Planning Phase',
					href: `/ai-labs/research?phase=${phase}`
				});
			}
		}
	}

	const took_ms = Date.now() - startTime;

	if (
		results.length === 0 &&
		runsResult.status === 'rejected' &&
		ideasResult.status === 'rejected'
	) {
		return json(
			{
				results: [],
				total: 0,
				query,
				took_ms,
				error: 'Search backend unavailable'
			},
			{ status: 502 }
		);
	}

	return json({
		results: results.slice(0, limit),
		total: results.length,
		query,
		took_ms
	} satisfies SearchResponse);
};

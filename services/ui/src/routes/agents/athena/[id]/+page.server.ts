import type { PageServerLoad } from './$types';
import { createGatewayClient } from '$lib/server/gateway';
import { error } from '@sveltejs/kit';

interface DashboardAgent {
	id: string;
	name: string;
	source: 'naomi' | 'athena';
	role: 'root' | 'manager' | 'worker';
	status: 'active' | 'idle' | 'busy' | 'offline';
	reliability_score?: number;
	hallucination_risk?: number;
	autonomy_level?: 'auto' | 'semi_auto' | 'supervised' | 'manual_review';
	can_delegate: boolean;
	can_execute: boolean;
	capabilities?: string[];
	parent_id?: string;
	department?: string;
	detail_url: string;
	api_endpoint: string;
}

interface AthenaAgentDetailResponse {
	agent: DashboardAgent;
	raw?: {
		agent: {
			id: string;
			name: string;
			agent_type: string;
			status: string;
			parent_agent_id?: string;
			department?: string;
			capabilities?: string;
			config?: string;
		};
		tasks?: Array<{
			id: string;
			status: string;
			description?: string;
		}>;
		metrics?: {
			tasks_completed: number;
			tasks_failed: number;
			avg_latency_ms: number;
		};
	};
}

export const load: PageServerLoad = async ({ params, platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const agentId = params.id;

		const data = await gateway.fetchJson<AthenaAgentDetailResponse>(
			`/public/dashboard/agents/athena/${agentId}`
		);

		if (!data.agent) {
			throw error(404, 'Agent not found');
		}

		return {
			agent: data.agent,
			raw: data.raw,
			error: null
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Error fetching Athena agent:', err);
		return {
			agent: null,
			raw: null,
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
};

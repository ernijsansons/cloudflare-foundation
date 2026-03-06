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

interface NaomiAgentDetailResponse {
	agent: DashboardAgent;
	raw?: {
		agent: {
			agent_id: string;
			tenant_id: string;
			business_id: string;
			agent_type: string;
			parent_agent_id?: string;
			scopes_json?: string;
		};
		tasks?: Array<{
			task_id: string;
			status: string;
			description?: string;
		}>;
		capabilities?: Array<{
			cap_id: string;
			scopes_json: string;
			expires_at?: string;
		}>;
	};
}

export const load: PageServerLoad = async ({ params, platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const agentId = params.id;

		const data = await gateway.fetchJson<NaomiAgentDetailResponse>(
			`/public/dashboard/agents/naomi/${agentId}`
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
		console.error('Error fetching Naomi agent:', err);
		return {
			agent: null,
			raw: null,
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
};

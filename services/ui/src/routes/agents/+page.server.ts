import type { PageServerLoad } from './$types';
import { createGatewayClient } from '$lib/server/gateway';

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

interface AgentListResponse {
	agents: DashboardAgent[];
	sources: {
		naomi: { enabled: boolean; healthy: boolean; count: number };
		athena: { enabled: boolean; healthy: boolean; count: number };
	};
}

export const load: PageServerLoad = async ({ platform, fetch, locals, url }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);

		// Get source filter from URL query params
		const source = url.searchParams.get('source') || 'all';

		const data = await gateway.fetchJson<AgentListResponse>(
			`/public/dashboard/agents?source=${source}`
		);

		return {
			agents: data.agents || [],
			sources: data.sources || {
				naomi: { enabled: false, healthy: false, count: 0 },
				athena: { enabled: false, healthy: false, count: 0 }
			},
			currentSource: source,
			error: null
		};
	} catch (error) {
		console.error('Error fetching agents:', error);
		return {
			agents: [],
			sources: {
				naomi: { enabled: false, healthy: false, count: 0 },
				athena: { enabled: false, healthy: false, count: 0 }
			},
			currentSource: 'all',
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};

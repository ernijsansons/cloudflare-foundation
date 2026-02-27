import type { PageServerLoad } from './$types';
import { createGatewayClient } from '$lib/server/gateway';

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);

		// No need to hardcode tenant_id - gateway client handles it
		const data = await gateway.fetchJson<{ agents: unknown[] }>(
			'/public/dashboard/agents?business_id=naomi'
		);

		return {
			agents: data.agents || [],
			error: null
		};
	} catch (error) {
		console.error('Error fetching agents:', error);
		return {
			agents: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};

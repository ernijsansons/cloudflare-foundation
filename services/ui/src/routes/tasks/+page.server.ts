import type { PageServerLoad } from './$types';
import { createGatewayClient } from '$lib/server/gateway';

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);

		// No need to hardcode tenant_id - gateway client handles it
		const data = await gateway.fetchJson<{ roadmaps: unknown[] }>(
			'/public/dashboard/roadmaps?business_id=naomi&status=active'
		);

		return {
			roadmaps: data.roadmaps || [],
			error: null
		};
	} catch (error) {
		console.error('Error fetching tasks:', error);
		return {
			roadmaps: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};

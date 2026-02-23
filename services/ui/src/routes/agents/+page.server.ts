import type { PageServerLoad } from './$types';

const NAOMI_API_BASE = 'https://naomi-oracle-cloudflare.erlvinc.workers.dev/v1';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch agents from Naomi API
		const response = await fetch(
			`${NAOMI_API_BASE}/dashboard/agents?tenant_id=erlvinc&business_id=naomi`
		);

		if (!response.ok) {
			console.error('Failed to fetch agents from Naomi API:', response.statusText);
			return {
				agents: [],
				error: `Failed to load agents: ${response.statusText}`
			};
		}

		const data = await response.json();
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

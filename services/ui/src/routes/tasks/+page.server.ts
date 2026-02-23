import type { PageServerLoad } from './$types';

const NAOMI_API_BASE = 'https://naomi-oracle-cloudflare.erlvinc.workers.dev/v1';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch active roadmaps (which contain tasks)
		const response = await fetch(
			`${NAOMI_API_BASE}/dashboard/roadmaps?tenant_id=erlvinc&business_id=naomi&status=active`
		);

		if (!response.ok) {
			console.error('Failed to fetch tasks from Naomi API:', response.statusText);
			return {
				roadmaps: [],
				error: `Failed to load tasks: ${response.statusText}`
			};
		}

		const data = await response.json();
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

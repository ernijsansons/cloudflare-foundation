import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, fetch }) => {
	try {
		// Try using the GATEWAY service binding first (internal, no auth required)
		const gateway = platform?.env?.GATEWAY;

		let response;
		if (gateway) {
			// Use service binding - create a proper request object
			const request = new Request('https://placeholder/api/public/dashboard/roadmaps?tenant_id=erlvinc&business_id=naomi&status=active');
			response = await gateway.fetch(request);
		} else {
			// Fallback to HTTP call (requires external access)
			response = await fetch('https://foundation-gateway-production.ernijs-ansons.workers.dev/api/public/dashboard/roadmaps?tenant_id=erlvinc&business_id=naomi&status=active');
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Failed to fetch tasks:', response.status, response.statusText, errorText);
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

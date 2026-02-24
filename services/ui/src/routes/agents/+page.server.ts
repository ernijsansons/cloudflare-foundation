import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, fetch }) => {
	try {
		// Try using the GATEWAY service binding first (internal, no auth required)
		const gateway = platform?.env?.GATEWAY;

		let response;
		if (gateway) {
			// Use service binding - create a proper request object
			const request = new Request('https://placeholder/api/public/dashboard/agents?tenant_id=erlvinc&business_id=naomi');
			response = await gateway.fetch(request);
		} else {
			// Fallback to HTTP call (requires external access)
			response = await fetch('https://foundation-gateway-production.ernijs-ansons.workers.dev/api/public/dashboard/agents?tenant_id=erlvinc&business_id=naomi');
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Failed to fetch agents:', response.status, response.statusText, errorText);
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

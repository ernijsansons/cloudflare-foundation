import type { CFCapability as SharedCapability } from '@foundation/shared';

import type { PageServerLoad } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import { transformCapability } from '$lib/utils/build-spec-transformer';


interface CapabilitiesResponse {
	items: SharedCapability[];
	total: number;
}

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const response = await gateway.fetchJson<CapabilitiesResponse>('/api/factory/capabilities');

		return {
			capabilities: (response.items ?? []).map(transformCapability),
			error: null
		};
	} catch (error) {
		console.error('capabilities load error:', error);
		return {
			capabilities: [],
			error: error instanceof Error ? error.message : 'Failed to fetch capabilities'
		};
	}
};

import type { BuildSpec as SharedBuildSpec } from '@foundation/shared';

import type { PageServerLoad } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import { transformBuildSpec } from '$lib/utils/build-spec-transformer';


interface BuildSpecsResponse {
	buildSpecs: SharedBuildSpec[];
	pagination: { limit: number; offset: number; count: number };
}

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const response = await gateway.fetchJson<BuildSpecsResponse>('/api/public/factory/build-specs');

		return {
			buildSpecs: (response.buildSpecs ?? []).map(transformBuildSpec),
			error: null
		};
	} catch (error) {
		console.error('build-specs load error:', error);
		return {
			buildSpecs: [],
			error: error instanceof Error ? error.message : 'Failed to fetch build specs'
		};
	}
};

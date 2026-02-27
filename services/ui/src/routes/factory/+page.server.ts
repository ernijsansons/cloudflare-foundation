import type {
	BuildSpec as SharedBuildSpec,
	CFCapability as SharedCapability,
	TemplateRegistryEntry as SharedTemplate
} from '@foundation/shared';

import type { PageServerLoad } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import { transformBuildSpec } from '$lib/utils/build-spec-transformer';


interface TemplatesResponse {
	items: SharedTemplate[];
	total: number;
}

interface CapabilitiesResponse {
	items: SharedCapability[];
	total: number;
}

interface BuildSpecsResponse {
	buildSpecs: SharedBuildSpec[];
	pagination: { limit: number; offset: number; count: number };
}

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);

		const [templatesRes, capabilitiesRes, buildSpecsRes] = await Promise.all([
			gateway.fetchJson<TemplatesResponse>('/api/factory/templates'),
			gateway.fetchJson<CapabilitiesResponse>('/api/factory/capabilities'),
			gateway.fetchJson<BuildSpecsResponse>('/api/factory/build-specs?limit=5')
		]);

		return {
			stats: {
				templateCount: templatesRes.items?.length ?? 0,
				capabilityCount: capabilitiesRes.items?.length ?? 0,
				buildSpecCount: buildSpecsRes.buildSpecs?.length ?? 0
			},
			recentBuildSpecs: (buildSpecsRes.buildSpecs ?? []).map(transformBuildSpec),
			error: null
		};
	} catch (error) {
		console.error('factory overview load error:', error);
		return {
			stats: {
				templateCount: 0,
				capabilityCount: 0,
				buildSpecCount: 0
			},
			recentBuildSpecs: [],
			error: error instanceof Error ? error.message : 'Failed to fetch factory data'
		};
	}
};

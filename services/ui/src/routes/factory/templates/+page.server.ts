import type { TemplateRegistryEntry as SharedTemplate } from '@foundation/shared';

import type { PageServerLoad } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import { transformTemplate } from '$lib/utils/build-spec-transformer';


interface TemplatesResponse {
	items: SharedTemplate[];
	total: number;
}

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const response = await gateway.fetchJson<TemplatesResponse>('/api/public/factory/templates');

		return {
			templates: (response.items ?? []).map(transformTemplate),
			error: null
		};
	} catch (error) {
		console.error('templates load error:', error);
		return {
			templates: [],
			error: error instanceof Error ? error.message : 'Failed to fetch templates'
		};
	}
};

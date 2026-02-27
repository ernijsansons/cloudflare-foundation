import type { TemplateRegistryEntry as SharedTemplate } from '@foundation/shared';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import { transformTemplate } from '$lib/utils/build-spec-transformer';


export const load: PageServerLoad = async ({ platform, fetch, locals, params }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const template = await gateway.fetchJson<SharedTemplate>(`/api/factory/templates/${params.slug}`);

		if (!template) {
			throw error(404, 'Template not found');
		}

		return {
			template: transformTemplate(template),
			error: null
		};
	} catch (caughtError) {
		console.error('template detail load error:', caughtError);

		if (
			caughtError &&
			typeof caughtError === 'object' &&
			'status' in caughtError &&
			caughtError.status === 404
		) {
			throw error(404, 'Template not found');
		}

		return {
			template: null,
			error: caughtError instanceof Error ? caughtError.message : 'Failed to fetch template'
		};
	}
};

import type { BuildSpec as SharedBuildSpec } from '@foundation/shared';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { createGatewayClient } from '$lib/server/gateway';
import { transformBuildSpec } from '$lib/utils/build-spec-transformer';


export const load: PageServerLoad = async ({ platform, fetch, locals, params }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);
		const buildSpec = await gateway.fetchJson<SharedBuildSpec>(`/api/factory/build-specs/${params.runId}`);

		if (!buildSpec) {
			throw error(404, 'Build specification not found');
		}

		return {
			buildSpec: transformBuildSpec(buildSpec),
			error: null
		};
	} catch (caughtError) {
		console.error('build-spec detail load error:', caughtError);

		if (
			caughtError &&
			typeof caughtError === 'object' &&
			'status' in caughtError &&
			caughtError.status === 404
		) {
			throw error(404, 'Build specification not found');
		}

		return {
			buildSpec: null,
			error: caughtError instanceof Error ? caughtError.message : 'Failed to fetch build specification'
		};
	}
};

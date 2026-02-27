/**
 * Search Results Page - Server Load
 *
 * Loads search results based on URL query parameters.
 */

import type { PageServerLoad } from './$types';

import type { SearchResult, SearchResponse } from '$lib/types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const query = url.searchParams.get('q') || '';
	const type = url.searchParams.get('type') || ''; // Filter by type: run, idea, phase, artifact, task
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

	if (!query.trim()) {
		return {
			query: '',
			type,
			results: [] as SearchResult[],
			total: 0,
			took_ms: 0
		};
	}

	try {
		const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);

		if (!response.ok) {
			return {
				query,
				type,
				results: [] as SearchResult[],
				total: 0,
				took_ms: 0,
				error: 'Search failed'
			};
		}

		const data: SearchResponse = await response.json();

		// Filter by type if specified
		let results = data.results;
		if (type) {
			results = results.filter((r) => r.type === type);
		}

		return {
			query,
			type,
			results,
			total: results.length,
			took_ms: data.took_ms || 0
		};
	} catch (error) {
		console.error('Search error:', error);
		return {
			query,
			type,
			results: [] as SearchResult[],
			total: 0,
			took_ms: 0,
			error: 'Search failed'
		};
	}
};

/**
 * Global Search Store
 *
 * Manages search state, recent searches, and keyboard shortcuts for Cmd+K search modal.
 */

import { goto } from '$app/navigation';
import type { SearchResult } from '$lib/types';

const RECENT_SEARCHES_KEY = 'foundation-recent-searches';
const MAX_RECENT_SEARCHES = 10;

// Re-export SearchResult for backward compatibility
export type { SearchResult };

interface SearchState {
	isOpen: boolean;
	query: string;
	results: SearchResult[];
	isLoading: boolean;
	selectedIndex: number;
	recentSearches: string[];
	error: string | null;
}

function loadRecentSearches(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function saveRecentSearches(searches: string[]): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
	} catch {
		// Ignore storage errors
	}
}

function createSearchStore() {
	const state = $state<SearchState>({
		isOpen: false,
		query: '',
		results: [],
		isLoading: false,
		selectedIndex: 0,
		recentSearches: [],
		error: null
	});

	// Load recent searches on init (client-side only)
	if (typeof window !== 'undefined') {
		state.recentSearches = loadRecentSearches();
	}

	return {
		get isOpen() {
			return state.isOpen;
		},
		get query() {
			return state.query;
		},
		get results() {
			return state.results;
		},
		get isLoading() {
			return state.isLoading;
		},
		get selectedIndex() {
			return state.selectedIndex;
		},
		get recentSearches() {
			return state.recentSearches;
		},
		get error() {
			return state.error;
		},

		open() {
			state.isOpen = true;
			state.query = '';
			state.results = [];
			state.selectedIndex = 0;
			state.error = null;
			state.recentSearches = loadRecentSearches();
		},

		close() {
			state.isOpen = false;
			state.query = '';
			state.results = [];
			state.selectedIndex = 0;
			state.error = null;
		},

		setQuery(query: string) {
			state.query = query;
			state.selectedIndex = 0;
		},

		setResults(results: SearchResult[]) {
			state.results = results;
			state.selectedIndex = 0;
			state.isLoading = false;
		},

		setLoading(loading: boolean) {
			state.isLoading = loading;
		},

		setError(error: string | null) {
			state.error = error;
			state.isLoading = false;
		},

		selectNext() {
			if (state.results.length > 0) {
				state.selectedIndex = (state.selectedIndex + 1) % state.results.length;
			}
		},

		selectPrevious() {
			if (state.results.length > 0) {
				state.selectedIndex = (state.selectedIndex - 1 + state.results.length) % state.results.length;
			}
		},

		selectIndex(index: number) {
			if (index >= 0 && index < state.results.length) {
				state.selectedIndex = index;
			}
		},

		navigateToSelected() {
			const selected = state.results[state.selectedIndex];
			if (selected) {
				this.addToRecent(state.query);
				this.close();
				goto(selected.href);
			}
		},

		addToRecent(query: string) {
			if (!query.trim()) return;

			const trimmed = query.trim();
			const filtered = state.recentSearches.filter((s) => s !== trimmed);
			const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);

			state.recentSearches = updated;
			saveRecentSearches(updated);
		},

		clearRecent() {
			state.recentSearches = [];
			saveRecentSearches([]);
		},

		async search(query: string): Promise<void> {
			if (!query.trim()) {
				state.results = [];
				state.isLoading = false;
				return;
			}

			state.isLoading = true;
			state.error = null;

			try {
				const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);

				if (!response.ok) {
					throw new Error('Search failed');
				}

				const data = await response.json();
				state.results = data.results ?? [];
				state.selectedIndex = 0;
			} catch (err) {
				state.error = err instanceof Error ? err.message : 'Search failed';
				state.results = [];
			} finally {
				state.isLoading = false;
			}
		}
	};
}

export const searchStore = createSearchStore();

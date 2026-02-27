/**
 * Filter & Saved Views Store
 *
 * Manages filter state, saved views, and URL synchronization for portfolio/listing pages.
 */

import type { FilterState, SavedView, SortField, SortDirection } from '$lib/types';
import { DEFAULT_FILTERS } from '$lib/types';

// Re-export types for backward compatibility
export type { FilterState, SavedView };

const SAVED_VIEWS_KEY = 'foundation-saved-views';

function loadSavedViews(): SavedView[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(SAVED_VIEWS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function saveSavedViews(views: SavedView[]): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
	} catch {
		// Ignore storage errors
	}
}

function generateId(): string {
	return `view_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createFiltersStore() {
	let filters = $state<FilterState>({ ...DEFAULT_FILTERS });
	let savedViews = $state<SavedView[]>([]);
	let activeViewId = $state<string | null>(null);

	// Load saved views on init
	if (typeof window !== 'undefined') {
		savedViews = loadSavedViews();
	}

	return {
		// Getters
		get filters() {
			return filters;
		},
		get savedViews() {
			return savedViews;
		},
		get activeViewId() {
			return activeViewId;
		},
		get hasActiveFilters() {
			return (
				filters.status.length > 0 ||
				filters.mode.length > 0 ||
				filters.qualityRange[0] > 0 ||
				filters.qualityRange[1] < 100 ||
				filters.dateRange[0] !== null ||
				filters.dateRange[1] !== null ||
				filters.search.trim() !== ''
			);
		},

		// Filter setters
		setStatus(status: string[]) {
			filters.status = status;
			activeViewId = null;
		},

		toggleStatus(status: string) {
			if (filters.status.includes(status)) {
				filters.status = filters.status.filter((s) => s !== status);
			} else {
				filters.status = [...filters.status, status];
			}
			activeViewId = null;
		},

		setMode(mode: ('local' | 'cloud')[]) {
			filters.mode = mode;
			activeViewId = null;
		},

		toggleMode(mode: 'local' | 'cloud') {
			if (filters.mode.includes(mode)) {
				filters.mode = filters.mode.filter((m) => m !== mode);
			} else {
				filters.mode = [...filters.mode, mode];
			}
			activeViewId = null;
		},

		setQualityRange(range: [number, number]) {
			filters.qualityRange = range;
			activeViewId = null;
		},

		setDateRange(range: [number | null, number | null]) {
			filters.dateRange = range;
			activeViewId = null;
		},

		setSort(sortBy: SortField, sortDir: SortDirection) {
			filters.sortBy = sortBy;
			filters.sortDir = sortDir;
			activeViewId = null;
		},

		setSearch(search: string) {
			filters.search = search;
			activeViewId = null;
		},

		resetFilters() {
			filters = { ...DEFAULT_FILTERS };
			activeViewId = null;
		},

		// Saved views management
		saveCurrentView(name: string): SavedView {
			const newView: SavedView = {
				id: generateId(),
				name,
				filters: { ...filters },
				createdAt: Date.now()
			};

			savedViews = [...savedViews, newView];
			saveSavedViews(savedViews);
			activeViewId = newView.id;

			return newView;
		},

		loadView(viewId: string) {
			const view = savedViews.find((v) => v.id === viewId);
			if (view) {
				filters = { ...view.filters };
				activeViewId = viewId;
			}
		},

		deleteView(viewId: string) {
			savedViews = savedViews.filter((v) => v.id !== viewId);
			saveSavedViews(savedViews);

			if (activeViewId === viewId) {
				activeViewId = null;
			}
		},

		updateViewName(viewId: string, name: string) {
			savedViews = savedViews.map((v) => (v.id === viewId ? { ...v, name } : v));
			saveSavedViews(savedViews);
		},

		// URL synchronization
		encodeToURL(): URLSearchParams {
			const params = new URLSearchParams();

			if (filters.status.length > 0) {
				params.set('status', filters.status.join(','));
			}
			if (filters.mode.length > 0) {
				params.set('mode', filters.mode.join(','));
			}
			if (filters.qualityRange[0] > 0 || filters.qualityRange[1] < 100) {
				params.set('quality', `${filters.qualityRange[0]}-${filters.qualityRange[1]}`);
			}
			if (filters.dateRange[0] !== null) {
				params.set('from', String(filters.dateRange[0]));
			}
			if (filters.dateRange[1] !== null) {
				params.set('to', String(filters.dateRange[1]));
			}
			if (filters.sortBy !== 'created_at') {
				params.set('sort', filters.sortBy);
			}
			if (filters.sortDir !== 'desc') {
				params.set('dir', filters.sortDir);
			}
			if (filters.search.trim()) {
				params.set('q', filters.search);
			}

			return params;
		},

		decodeFromURL(params: URLSearchParams) {
			const status = params.get('status');
			const mode = params.get('mode');
			const quality = params.get('quality');
			const from = params.get('from');
			const to = params.get('to');
			const sort = params.get('sort');
			const dir = params.get('dir');
			const q = params.get('q');

			filters = {
				status: status ? status.split(',') : [],
				mode: mode ? (mode.split(',') as ('local' | 'cloud')[]) : [],
				qualityRange: quality
					? (quality.split('-').map(Number) as [number, number])
					: [0, 100],
				dateRange: [from ? Number(from) : null, to ? Number(to) : null],
				sortBy: (sort as FilterState['sortBy']) || 'created_at',
				sortDir: (dir as FilterState['sortDir']) || 'desc',
				search: q || ''
			};
			activeViewId = null;
		}
	};
}

export const filtersStore = createFiltersStore();

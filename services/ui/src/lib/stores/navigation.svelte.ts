/**
 * Navigation Store
 *
 * Manages breadcrumb trail and navigation history for hierarchical navigation.
 */

import type { BreadcrumbItem } from '$lib/types';

// Re-export type for backward compatibility
export type { BreadcrumbItem };

function createNavigationStore() {
	let breadcrumbs = $state<BreadcrumbItem[]>([]);

	return {
		get breadcrumbs() {
			return breadcrumbs;
		},

		get hasBreadcrumbs() {
			return breadcrumbs.length > 0;
		},

		/**
		 * Set the entire breadcrumb trail
		 */
		setBreadcrumbs(items: BreadcrumbItem[]) {
			breadcrumbs = items;
		},

		/**
		 * Add a breadcrumb to the end of the trail
		 */
		push(item: BreadcrumbItem) {
			breadcrumbs = [...breadcrumbs, item];
		},

		/**
		 * Remove the last breadcrumb
		 */
		pop(): BreadcrumbItem | undefined {
			if (breadcrumbs.length === 0) return undefined;
			const last = breadcrumbs[breadcrumbs.length - 1];
			breadcrumbs = breadcrumbs.slice(0, -1);
			return last;
		},

		/**
		 * Clear all breadcrumbs
		 */
		clear() {
			breadcrumbs = [];
		},

		/**
		 * Build breadcrumbs from a path hierarchy
		 */
		buildFromPath(segments: Array<{ label: string; href: string; icon?: string }>) {
			breadcrumbs = segments;
		},

		/**
		 * Helper to build common breadcrumb patterns
		 */
		forRunDetail(runId: string, runName: string, section?: string) {
			const trail: BreadcrumbItem[] = [
				{ label: 'AI Labs', href: '/ai-labs' },
				{ label: 'Research', href: '/ai-labs/research' },
				{ label: 'Runs', href: '/ai-labs/research' },
				{ label: runName || runId.slice(0, 8), href: `/ai-labs/research/runs/${runId}` }
			];

			if (section) {
				trail.push({
					label: section,
					href: `/ai-labs/research/runs/${runId}/${section.toLowerCase()}`
				});
			}

			breadcrumbs = trail;
		},

		forIdeaDetail(ideaId: string, ideaTitle: string) {
			breadcrumbs = [
				{ label: 'AI Labs', href: '/ai-labs' },
				{ label: 'Ideas', href: '/ai-labs/idea' },
				{ label: ideaTitle || ideaId.slice(0, 8), href: `/ai-labs/idea/${ideaId}` }
			];
		},

		forProjectDetail(projectId: string, projectName: string) {
			breadcrumbs = [
				{ label: 'AI Labs', href: '/ai-labs' },
				{ label: 'Research', href: '/ai-labs/research' },
				{ label: 'Projects', href: '/ai-labs/research/projects' },
				{ label: projectName || projectId.slice(0, 8), href: `/ai-labs/research/projects/${projectId}` }
			];
		},

		forTaskDetail(taskId: string, taskTitle: string) {
			breadcrumbs = [
				{ label: 'AI Labs', href: '/ai-labs' },
				{ label: 'Production', href: '/ai-labs/production' },
				{ label: 'Tasks', href: '/ai-labs/production/tasks' },
				{ label: taskTitle || taskId.slice(0, 8), href: `/ai-labs/production/tasks/${taskId}` }
			];
		},

		forPortfolio() {
			breadcrumbs = [{ label: 'Portfolio', href: '/portfolio' }];
		},

		forDashboard() {
			breadcrumbs = [];
		}
	};
}

export const navigationStore = createNavigationStore();

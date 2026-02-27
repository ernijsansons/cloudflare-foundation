/**
 * Activity Store
 *
 * Tracks recent user actions for activity feed on dashboard.
 */

import type { ActivityType, ActivityItem } from '$lib/types';

// Re-export types for backward compatibility
export type { ActivityType, ActivityItem };

const ACTIVITY_KEY = 'foundation-recent-activity';
const MAX_ACTIVITIES = 50;

function loadActivities(): ActivityItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(ACTIVITY_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function saveActivities(activities: ActivityItem[]): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
	} catch {
		// Ignore storage errors
	}
}

function generateId(): string {
	return `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getActivityLabel(type: ActivityType): string {
	switch (type) {
		case 'run_created':
			return 'Created run';
		case 'run_completed':
			return 'Completed run';
		case 'run_killed':
			return 'Killed run';
		case 'run_viewed':
			return 'Viewed run';
		case 'idea_created':
			return 'Created idea';
		case 'idea_viewed':
			return 'Viewed idea';
		case 'phase_completed':
			return 'Completed phase';
		case 'artifact_viewed':
			return 'Viewed artifact';
		case 'search_performed':
			return 'Searched';
		default:
			return 'Activity';
	}
}

function getActivityIcon(type: ActivityType): string {
	switch (type) {
		case 'run_created':
			return '+';
		case 'run_completed':
			return '✓';
		case 'run_killed':
			return '×';
		case 'run_viewed':
		case 'idea_viewed':
		case 'artifact_viewed':
			return '👁';
		case 'idea_created':
			return '💡';
		case 'phase_completed':
			return '→';
		case 'search_performed':
			return '🔍';
		default:
			return '•';
	}
}

function createActivityStore() {
	let activities = $state<ActivityItem[]>([]);

	// Load activities on init
	if (typeof window !== 'undefined') {
		activities = loadActivities();
	}

	return {
		get activities() {
			return activities;
		},

		get recentActivities() {
			return activities.slice(0, 10);
		},

		/**
		 * Record a new activity
		 */
		record(
			type: ActivityType,
			entityId: string,
			entityName: string,
			entityHref: string,
			metadata?: Record<string, unknown>
		) {
			const newActivity: ActivityItem = {
				id: generateId(),
				type,
				entityId,
				entityName,
				entityHref,
				metadata,
				timestamp: Date.now()
			};

			// Dedupe: don't add if same entity was just viewed
			if (type.endsWith('_viewed')) {
				const recent = activities[0];
				if (recent && recent.entityId === entityId && recent.type === type) {
					// Update timestamp instead of adding duplicate
					activities[0] = { ...recent, timestamp: Date.now() };
					saveActivities(activities);
					return newActivity;
				}
			}

			activities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
			saveActivities(activities);

			return newActivity;
		},

		/**
		 * Shorthand methods for common actions
		 */
		recordRunCreated(runId: string, runName: string) {
			return this.record('run_created', runId, runName, `/ai-labs/research/runs/${runId}`);
		},

		recordRunViewed(runId: string, runName: string) {
			return this.record('run_viewed', runId, runName, `/ai-labs/research/runs/${runId}`);
		},

		recordRunCompleted(runId: string, runName: string) {
			return this.record('run_completed', runId, runName, `/ai-labs/research/runs/${runId}`);
		},

		recordIdeaCreated(ideaId: string, ideaTitle: string) {
			return this.record('idea_created', ideaId, ideaTitle, `/ai-labs/idea/${ideaId}`);
		},

		recordIdeaViewed(ideaId: string, ideaTitle: string) {
			return this.record('idea_viewed', ideaId, ideaTitle, `/ai-labs/idea/${ideaId}`);
		},

		recordSearch(query: string) {
			return this.record('search_performed', query, `Search: ${query}`, '#', { query });
		},

		/**
		 * Get label for activity type
		 */
		getLabel: getActivityLabel,

		/**
		 * Get icon for activity type
		 */
		getIcon: getActivityIcon,

		/**
		 * Format timestamp as relative time
		 */
		formatRelativeTime(timestamp: number): string {
			const now = Date.now();
			const diff = now - timestamp;
			const seconds = Math.floor(diff / 1000);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);

			if (days > 0) return `${days}d ago`;
			if (hours > 0) return `${hours}h ago`;
			if (minutes > 0) return `${minutes}m ago`;
			return 'just now';
		},

		/**
		 * Clear all activity
		 */
		clear() {
			activities = [];
			saveActivities([]);
		}
	};
}

export const activityStore = createActivityStore();

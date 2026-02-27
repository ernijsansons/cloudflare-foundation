<script lang="ts">
	interface Activity {
		id: string;
		type: 'run_started' | 'run_completed' | 'run_killed' | 'phase_completed' | 'idea_created' | 'idea_promoted';
		title: string;
		description?: string;
		timestamp: number;
		runId?: string;
		ideaId?: string;
		phase?: string;
	}

	interface Props {
		activities: Activity[];
		maxItems?: number;
		onActivityClick?: (_activity: Activity) => void;
	}

	let { activities, maxItems = 10, onActivityClick }: Props = $props();

	const displayActivities = $derived(() => activities.slice(0, maxItems));

	function formatRelativeTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp * 1000;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return 'just now';
	}

	function getActivityIcon(type: string): string {
		switch (type) {
			case 'run_started':
				return '🚀';
			case 'run_completed':
				return '✅';
			case 'run_killed':
				return '💀';
			case 'phase_completed':
				return '📋';
			case 'idea_created':
				return '💡';
			case 'idea_promoted':
				return '⬆️';
			default:
				return '📝';
		}
	}

	function getActivityColor(type: string): string {
		switch (type) {
			case 'run_started':
				return 'var(--color-status-running, #3b82f6)';
			case 'run_completed':
				return 'var(--color-status-completed, #10b981)';
			case 'run_killed':
				return 'var(--color-status-killed, #991b1b)';
			case 'phase_completed':
				return 'var(--color-primary, #6366f1)';
			case 'idea_created':
				return 'var(--color-warning, #f59e0b)';
			case 'idea_promoted':
				return 'var(--color-success, #10b981)';
			default:
				return 'var(--color-text-muted, #6b7280)';
		}
	}
</script>

<div class="recent-activity">
	<div class="activity-header">
		<h3 class="activity-title">Recent Activity</h3>
		<span class="activity-count">{activities.length} total</span>
	</div>

	<div class="activity-list">
		{#each displayActivities() as activity}
			<button
				class="activity-item"
				onclick={() => onActivityClick?.(activity)}
				type="button"
				disabled={!onActivityClick}
			>
				<div class="activity-icon-wrapper" style="--activity-color: {getActivityColor(activity.type)}">
					<span class="activity-icon">{getActivityIcon(activity.type)}</span>
				</div>

				<div class="activity-content">
					<span class="activity-item-title">{activity.title}</span>
					{#if activity.description}
						<span class="activity-description">{activity.description}</span>
					{/if}
					{#if activity.phase}
						<span class="activity-phase">{activity.phase}</span>
					{/if}
				</div>

				<span class="activity-time">{formatRelativeTime(activity.timestamp)}</span>
			</button>
		{/each}

		{#if activities.length === 0}
			<div class="empty-state">
				<span class="empty-icon">📭</span>
				<p>No recent activity</p>
			</div>
		{/if}
	</div>

	{#if activities.length > maxItems}
		<div class="activity-footer">
			<span class="more-count">+{activities.length - maxItems} more</span>
		</div>
	{/if}
</div>

<style>
	.recent-activity {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
		overflow: hidden;
	}

	.activity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.activity-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.activity-count {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		max-height: 400px;
		overflow-y: auto;
	}

	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s ease;
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-item:hover:not(:disabled) {
		background: var(--color-bg, white);
	}

	.activity-item:disabled {
		cursor: default;
	}

	.activity-icon-wrapper {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--activity-color) 15%, transparent);
		border-radius: 8px;
		flex-shrink: 0;
	}

	.activity-icon {
		font-size: 1rem;
	}

	.activity-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.activity-item-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.activity-description {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.activity-phase {
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: capitalize;
		color: var(--color-primary, #6366f1);
	}

	.activity-time {
		font-size: 0.6875rem;
		color: var(--color-text-subtle, #9ca3af);
		white-space: nowrap;
	}

	.activity-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		text-align: center;
	}

	.more-count {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	@media (prefers-color-scheme: dark) {
		.activity-item:hover:not(:disabled) {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}
	}
</style>

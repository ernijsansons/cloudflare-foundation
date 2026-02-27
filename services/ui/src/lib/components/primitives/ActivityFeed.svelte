<script lang="ts">
	import { activityStore } from '$lib/stores';
	import type { ActivityItem } from '$lib/types';

	interface Props {
		items?: ActivityItem[];
		limit?: number;
		showHeader?: boolean;
		showClearButton?: boolean;
		emptyMessage?: string;
	}

	let {
		items,
		limit = 10,
		showHeader = true,
		showClearButton = true,
		emptyMessage = 'No recent activity'
	}: Props = $props();

	// Use provided items or fall back to store
	const activities = $derived((items ?? activityStore.activities).slice(0, limit));
	const hasActivities = $derived(activities.length > 0);

	function formatTime(timestamp: number): string {
		return activityStore.formatRelativeTime(timestamp);
	}

	function handleClear() {
		if (confirm('Clear all activity?')) {
			activityStore.clear();
		}
	}
</script>

<div class="activity-feed">
	{#if showHeader}
		<div class="feed-header">
			<h3 class="feed-title">Recent Activity</h3>
			{#if showClearButton && hasActivities}
				<button class="feed-clear" type="button" onclick={handleClear}>
					Clear
				</button>
			{/if}
		</div>
	{/if}

	{#if hasActivities}
		<ul class="feed-list">
			{#each activities as activity}
				<li class="feed-item">
					<span class="item-icon">{activityStore.getIcon(activity.type)}</span>
					<div class="item-content">
						<a href={activity.entityHref} class="item-link">
							<span class="item-action">{activityStore.getLabel(activity.type)}</span>
							<span class="item-entity">{activity.entityName}</span>
						</a>
						<span class="item-time">{formatTime(activity.timestamp)}</span>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="feed-empty">
			<span class="empty-icon">📋</span>
			<span class="empty-text">{emptyMessage}</span>
		</div>
	{/if}
</div>

<style>
	.activity-feed {
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-lg, 10px);
		overflow: hidden;
	}

	.feed-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, hsl(220, 20%, 90%));
	}

	.feed-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.feed-clear {
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm, 4px);
		transition: all var(--transition-fast, 150ms);
	}

	.feed-clear:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
		color: var(--color-error, hsl(0, 84%, 55%));
	}

	.feed-list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 400px;
		overflow-y: auto;
	}

	.feed-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, hsl(220, 20%, 90%));
		transition: background-color var(--transition-fast, 150ms);
	}

	.feed-item:last-child {
		border-bottom: none;
	}

	.feed-item:hover {
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
	}

	.item-icon {
		font-size: 1rem;
		line-height: 1.4;
		flex-shrink: 0;
		opacity: 0.7;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-link {
		display: block;
		text-decoration: none;
		color: var(--color-text, #111827);
		margin-bottom: 0.125rem;
	}

	.item-link:hover .item-entity {
		color: var(--color-primary, hsl(212, 100%, 48%));
	}

	.item-action {
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		margin-right: 0.25rem;
	}

	.item-entity {
		font-size: 0.8125rem;
		font-weight: 500;
		transition: color var(--transition-fast, 150ms);
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-time {
		font-size: 0.6875rem;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.feed-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 0.8125rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
	}

	@media (prefers-color-scheme: dark) {
		.activity-feed {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.feed-item:hover {
			background: var(--color-bg-secondary, hsl(0, 0%, 8%));
		}

		.feed-clear:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>

<script lang="ts">
	interface PinnedItem {
		id: string;
		type: 'run' | 'idea';
		title: string;
		status?: string;
		qualityScore?: number;
		phase?: string;
		href: string;
		pinnedAt: number;
	}

	interface Props {
		items: PinnedItem[];
		onUnpin?: (_id: string) => void;
		maxItems?: number;
	}

	let { items, onUnpin, maxItems = 6 }: Props = $props();

	const displayItems = $derived(() =>
		items
			.sort((a, b) => b.pinnedAt - a.pinnedAt)
			.slice(0, maxItems)
	);

	function getStatusColor(status: string | undefined): string {
		switch (status) {
			case 'running':
				return 'var(--color-status-running, #3b82f6)';
			case 'completed':
				return 'var(--color-status-completed, #10b981)';
			case 'killed':
				return 'var(--color-status-killed, #991b1b)';
			case 'failed':
				return 'var(--color-status-failed, #ef4444)';
			case 'paused':
				return 'var(--color-status-paused, #8b5cf6)';
			default:
				return 'var(--color-text-muted, #6b7280)';
		}
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return 'var(--color-success, #10b981)';
		if (score >= 60) return 'var(--color-warning, #f59e0b)';
		return 'var(--color-error, #ef4444)';
	}

	function handleUnpin(e: MouseEvent, id: string) {
		e.preventDefault();
		e.stopPropagation();
		onUnpin?.(id);
	}
</script>

<div class="pinned-items">
	<div class="pinned-header">
		<h3 class="pinned-title">
			<span class="pin-icon">📌</span>
			Pinned Items
		</h3>
		<span class="pinned-count">{items.length} pinned</span>
	</div>

	<div class="pinned-grid">
		{#each displayItems() as item}
			<a href={item.href} class="pinned-card">
				<div class="card-header">
					<span class="item-type type-{item.type}">
						{item.type === 'run' ? '🔬' : '💡'}
						{item.type}
					</span>
					{#if onUnpin}
						<button
							class="unpin-btn"
							onclick={(e) => handleUnpin(e, item.id)}
							type="button"
							aria-label="Unpin item"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					{/if}
				</div>

				<h4 class="item-title">{item.title}</h4>

				<div class="card-footer">
					{#if item.status}
						<span class="item-status" style="--status-color: {getStatusColor(item.status)}">
							{item.status}
						</span>
					{/if}

					{#if item.qualityScore !== undefined}
						<span class="item-score" style="color: {getScoreColor(item.qualityScore)}">
							{item.qualityScore}
						</span>
					{/if}

					{#if item.phase}
						<span class="item-phase">{item.phase}</span>
					{/if}
				</div>
			</a>
		{/each}

		{#if items.length === 0}
			<div class="empty-state">
				<span class="empty-icon">📌</span>
				<p>No pinned items yet</p>
				<span class="empty-hint">Star runs or ideas to pin them here</span>
			</div>
		{/if}
	</div>

	{#if items.length > maxItems}
		<div class="pinned-footer">
			<span class="more-count">+{items.length - maxItems} more pinned</span>
		</div>
	{/if}
</div>

<style>
	.pinned-items {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
		overflow: hidden;
	}

	.pinned-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.pinned-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pin-icon {
		font-size: 1rem;
	}

	.pinned-count {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.pinned-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
		padding: 1rem 1.25rem;
	}

	.pinned-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.pinned-card:hover {
		border-color: var(--color-primary, #6366f1);
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-type {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.type-run {
		background: color-mix(in srgb, var(--color-primary, #6366f1) 15%, transparent);
		color: var(--color-primary, #6366f1);
	}

	.type-idea {
		background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
		color: var(--color-warning, #f59e0b);
	}

	.unpin-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 4px;
		color: var(--color-text-subtle, #9ca3af);
		cursor: pointer;
		opacity: 0;
		transition: all 0.15s ease;
	}

	.pinned-card:hover .unpin-btn {
		opacity: 1;
	}

	.unpin-btn:hover {
		background: var(--color-error, #ef4444);
		color: white;
	}

	.item-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: auto;
	}

	.item-status {
		font-size: 0.625rem;
		font-weight: 500;
		text-transform: uppercase;
		padding: 0.0625rem 0.375rem;
		background: color-mix(in srgb, var(--status-color) 15%, transparent);
		color: var(--status-color);
		border-radius: 3px;
	}

	.item-score {
		font-size: 0.75rem;
		font-weight: 600;
	}

	.item-phase {
		font-size: 0.625rem;
		color: var(--color-text-muted, #6b7280);
		text-transform: capitalize;
	}

	.pinned-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		text-align: center;
	}

	.more-count {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.empty-hint {
		font-size: 0.75rem;
		color: var(--color-text-subtle, #9ca3af);
		margin-top: 0.25rem;
	}

	@media (max-width: 640px) {
		.pinned-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-color-scheme: dark) {
		.pinned-card {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}
	}
</style>

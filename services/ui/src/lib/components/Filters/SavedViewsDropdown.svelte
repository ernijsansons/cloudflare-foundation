<script lang="ts">
	import type { SavedView } from '$lib/types';

	interface Props {
		views: SavedView[];
		activeViewId: string | null;
		onLoadView?: (_viewId: string) => void;
		onDeleteView?: (_viewId: string) => void;
		onSaveCurrentView?: () => void;
	}

	let { views, activeViewId, onLoadView, onDeleteView, onSaveCurrentView }: Props = $props();

	let isOpen = $state(false);
	let showSaveInput = $state(false);
	let newViewName = $state('');

	function toggleDropdown() {
		isOpen = !isOpen;
		if (!isOpen) {
			showSaveInput = false;
			newViewName = '';
		}
	}

	function handleLoadView(viewId: string) {
		onLoadView?.(viewId);
		isOpen = false;
	}

	function handleDeleteView(event: MouseEvent, viewId: string) {
		event.stopPropagation();
		if (confirm('Delete this saved view?')) {
			onDeleteView?.(viewId);
		}
	}

	function handleSave() {
		if (newViewName.trim()) {
			onSaveCurrentView?.();
			showSaveInput = false;
			newViewName = '';
			isOpen = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSave();
		} else if (event.key === 'Escape') {
			showSaveInput = false;
			newViewName = '';
		}
	}

	function handleViewItemKeyDown(event: KeyboardEvent, viewId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleLoadView(viewId);
		}
	}

	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.saved-views')) {
			isOpen = false;
			showSaveInput = false;
		}
	}

	const activeView = $derived(views.find((v) => v.id === activeViewId));
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="saved-views">
	<button class="views-trigger" type="button" onclick={toggleDropdown}>
		<span class="views-icon">📑</span>
		<span class="views-label">
			{activeView ? activeView.name : 'Saved Views'}
		</span>
		<span class="views-chevron" class:open={isOpen}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</span>
	</button>

	{#if isOpen}
		<div class="views-dropdown">
			{#if views.length > 0}
				<div class="views-list" role="listbox">
					{#each views as view}
							<div
							class="view-item"
							class:active={view.id === activeViewId}
							role="option"
							aria-selected={view.id === activeViewId}
							tabindex="0"
							onclick={() => handleLoadView(view.id)}
							onkeydown={(e) => handleViewItemKeyDown(e, view.id)}
						>
							<span class="view-name">{view.name}</span>
							<button
								class="view-delete"
								type="button"
								onclick={(e) => handleDeleteView(e, view.id)}
								aria-label="Delete view"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
							</button>
						</div>
					{/each}
				</div>
				<div class="views-divider"></div>
			{/if}

			{#if showSaveInput}
				<div class="save-input-wrapper">
					<input
						type="text"
						class="save-input"
						placeholder="View name..."
						bind:value={newViewName}
						onkeydown={handleKeyDown}
					/>
					<button class="save-confirm" type="button" onclick={handleSave} aria-label="Save view">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</button>
				</div>
			{:else}
				<button
					class="save-view-btn"
					type="button"
					onclick={() => (showSaveInput = true)}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					<span>Save Current View</span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.saved-views {
		position: relative;
	}

	.views-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-md, 6px);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		cursor: pointer;
		transition: all var(--transition-fast, 150ms);
	}

	.views-trigger:hover {
		background: var(--color-bg, white);
		border-color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.views-trigger:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: 2px;
	}

	.views-icon {
		font-size: 0.875rem;
	}

	.views-label {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.views-chevron {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		transition: transform var(--transition-fast, 150ms);
	}

	.views-chevron.open {
		transform: rotate(180deg);
	}

	.views-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 200px;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-md, 6px);
		box-shadow: var(--shadow-lg);
		z-index: 50;
		overflow: hidden;
	}

	.views-list {
		max-height: 200px;
		overflow-y: auto;
	}

	.view-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: none;
		border: none;
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.view-item:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.view-item:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: -2px;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.view-item.active {
		background: color-mix(in srgb, var(--color-primary, hsl(212, 100%, 48%)) 10%, transparent);
	}

	.view-name {
		flex: 1;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.view-delete {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: var(--radius-sm, 4px);
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		cursor: pointer;
		opacity: 0;
		transition: all var(--transition-fast, 150ms);
	}

	.view-item:hover .view-delete {
		opacity: 1;
	}

	.view-delete:hover {
		background: var(--color-error, hsl(0, 84%, 55%));
		color: white;
	}

	.view-delete:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: 2px;
		opacity: 1;
	}

	.views-divider {
		height: 1px;
		background: var(--color-border, hsl(220, 20%, 90%));
	}

	.save-view-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: none;
		border: none;
		font-size: 0.875rem;
		color: var(--color-primary, hsl(212, 100%, 48%));
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.save-view-btn:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.save-view-btn:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: -2px;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.save-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.save-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-sm, 4px);
		font-size: 0.875rem;
		font-family: inherit;
		background: var(--color-bg, white);
		color: var(--color-text, #111827);
	}

	.save-input:focus {
		outline: none;
		border-color: var(--color-border-focus);
	}

	.save-confirm {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary, hsl(212, 100%, 48%));
		border: none;
		border-radius: var(--radius-sm, 4px);
		color: white;
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.save-confirm:hover {
		background: var(--color-primary-hover, hsl(212, 100%, 40%));
	}

	.save-confirm:focus-visible {
		outline: 2px solid var(--color-text, #111827);
		outline-offset: 2px;
	}

	@media (prefers-color-scheme: dark) {
		.views-dropdown {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.view-item:hover,
		.save-view-btn:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>

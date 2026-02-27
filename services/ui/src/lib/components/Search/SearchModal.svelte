<script lang="ts">
	import { goto } from '$app/navigation';
	import { searchStore } from '$lib/stores';
	import { activityStore } from '$lib/stores';
	import SearchResults from './SearchResults.svelte';

	let inputElement: HTMLInputElement | null = $state(null);
	let debounceTimer: ReturnType<typeof setTimeout> | null = $state(null);

	// Handle keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		if (!searchStore.isOpen) return;

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				searchStore.close();
				break;
			case 'ArrowDown':
				event.preventDefault();
				searchStore.selectNext();
				break;
			case 'ArrowUp':
				event.preventDefault();
				searchStore.selectPrevious();
				break;
			case 'Enter':
				event.preventDefault();
				if (searchStore.results.length > 0) {
					navigateToSelected();
				}
				break;
		}
	}

	// Navigate to selected result
	function navigateToSelected() {
		const selected = searchStore.results[searchStore.selectedIndex];
		if (selected) {
			searchStore.addToRecent(searchStore.query);
			activityStore.recordSearch(searchStore.query);
			searchStore.close();
			goto(selected.href);
		}
	}

	// Handle input change with debounce
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		searchStore.setQuery(value);

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Debounce search
		debounceTimer = setTimeout(() => {
			if (value.trim()) {
				searchStore.search(value);
			}
		}, 200);
	}

	// Handle clicking a result
	function handleSelectResult(result: { href: string }) {
		searchStore.addToRecent(searchStore.query);
		activityStore.recordSearch(searchStore.query);
		searchStore.close();
		goto(result.href);
	}

	// Handle selecting a recent search
	function handleSelectRecent(query: string) {
		searchStore.setQuery(query);
		searchStore.search(query);
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			searchStore.close();
		}
	}

	// Focus input when modal opens
	$effect(() => {
		if (searchStore.isOpen && inputElement) {
			// Use setTimeout to ensure DOM is ready
			setTimeout(() => {
				inputElement?.focus();
			}, 0);
		}
	});

	// Cleanup timer on unmount
	$effect(() => {
		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if searchStore.isOpen}
	<div
		class="search-backdrop"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && searchStore.close()}
		role="dialog"
		aria-modal="true"
		aria-label="Search"
		tabindex="-1"
	>
		<div class="search-modal">
			<div class="search-header">
				<div class="search-input-wrapper">
					<span class="search-icon">🔍</span>
					<input
						bind:this={inputElement}
						type="text"
						class="search-input"
						placeholder="Search runs, ideas, artifacts..."
						value={searchStore.query}
						oninput={handleInput}
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						spellcheck="false"
					/>
					{#if searchStore.query}
						<button
							class="search-clear"
							onclick={() => searchStore.setQuery('')}
							type="button"
							aria-label="Clear search"
						>
							×
						</button>
					{/if}
				</div>
			</div>

			<div class="search-body">
				<SearchResults
					results={searchStore.results}
					selectedIndex={searchStore.selectedIndex}
					isLoading={searchStore.isLoading}
					error={searchStore.error}
					query={searchStore.query}
					recentSearches={searchStore.recentSearches}
					onSelectResult={handleSelectResult}
					onSelectRecent={handleSelectRecent}
					onClearRecent={() => searchStore.clearRecent()}
				/>
			</div>

			<div class="search-footer">
				<div class="search-hint">
					<kbd>↑</kbd>
					<kbd>↓</kbd>
					<span>Navigate</span>
				</div>
				<div class="search-hint">
					<kbd>↵</kbd>
					<span>Open</span>
				</div>
				<div class="search-hint">
					<kbd>Esc</kbd>
					<span>Close</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.search-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
		z-index: 9999;
		animation: fadeIn 150ms ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.search-modal {
		width: 100%;
		max-width: 600px;
		background: var(--color-bg, white);
		border-radius: var(--radius-lg, 10px);
		box-shadow: var(--shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1));
		overflow: hidden;
		animation: slideIn 200ms ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.search-header {
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, hsl(220, 20%, 90%));
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
		border-radius: var(--radius-md, 6px);
		padding: 0 1rem;
	}

	.search-icon {
		font-size: 1rem;
		opacity: 0.5;
	}

	.search-input {
		flex: 1;
		padding: 0.875rem 0;
		font-size: 1rem;
		font-family: inherit;
		background: transparent;
		border: none;
		outline: none;
		color: var(--color-text, #111827);
	}

	.search-input::placeholder {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.search-clear {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
		border: none;
		border-radius: var(--radius-full, 9999px);
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		font-size: 1rem;
		cursor: pointer;
		transition: all var(--transition-fast, 150ms);
	}

	.search-clear:hover {
		background: var(--color-border, hsl(220, 20%, 90%));
		color: var(--color-text, #111827);
	}

	.search-body {
		max-height: 450px;
		overflow-y: auto;
	}

	.search-footer {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--color-border, hsl(220, 20%, 90%));
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
	}

	.search-hint {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 4px;
		font-family: inherit;
		font-size: 0.6875rem;
		font-weight: 500;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: 3px;
		box-shadow: 0 1px 0 var(--color-border, hsl(220, 20%, 90%));
	}

	@media (prefers-color-scheme: dark) {
		.search-backdrop {
			background: rgba(0, 0, 0, 0.7);
		}

		.search-modal {
			background: var(--color-bg, hsl(0, 0%, 4%));
			border: 1px solid var(--color-border, hsl(0, 0%, 15%));
		}

		kbd {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
			border-color: var(--color-border, hsl(0, 0%, 15%));
			box-shadow: 0 1px 0 var(--color-border, hsl(0, 0%, 15%));
		}
	}

	@media (max-width: 640px) {
		.search-backdrop {
			padding-top: 2rem;
			padding-left: 1rem;
			padding-right: 1rem;
		}

		.search-modal {
			max-width: none;
		}
	}
</style>

<script lang="ts">
	interface Tab {
		key: string;
		label: string;
	}

	interface Props {
		tabs: Tab[];
		active: string;
		onChange: (_key: string) => void;
	}

	let { tabs, active, onChange }: Props = $props();

	function handleTabClick(key: string) {
		if (key !== active) {
			onChange(key);
		}
	}
</script>

<div class="tabs-container">
	<div class="tabs-list">
		{#each tabs as tab}
			<button
				type="button"
				class="tab-button"
				class:active={tab.key === active}
				onclick={() => handleTabClick(tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.tabs-container {
		width: 100%;
		border-bottom: 1px solid var(--color-border);
	}

	.tabs-list {
		display: flex;
		gap: 0;
	}

	.tab-button {
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
		position: relative;
	}

	.tab-button:hover {
		color: var(--color-text);
		background: var(--color-bg-secondary);
	}

	.tab-button.active {
		color: var(--color-primary);
		font-weight: 600;
		border-bottom-color: var(--color-primary);
	}

	.tab-button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}
</style>

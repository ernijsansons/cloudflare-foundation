<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		onInput: (_value: string) => void;
	}

	let { value = $bindable(), placeholder = 'Search...', onInput }: Props = $props();

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		value = input.value;
		onInput(input.value);
	}

	function handleClear() {
		value = '';
		onInput('');
	}
</script>

<div class="search-input-container">
	<svg
		class="search-icon"
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="11" cy="11" r="8"></circle>
		<path d="m21 21-4.35-4.35"></path>
	</svg>

	<input
		type="text"
		class="search-input"
		{placeholder}
		{value}
		oninput={handleInput}
	/>

	{#if value}
		<button type="button" class="clear-button" onclick={handleClear} aria-label="Clear search">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	{/if}
</div>

<style>
	.search-input-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		color: var(--color-text-secondary);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 2.5rem 0.625rem 2.5rem;
		font-size: 0.875rem;
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.search-input::placeholder {
		color: var(--color-text-secondary);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.clear-button {
		position: absolute;
		right: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.clear-button:hover {
		color: var(--color-text);
		background: var(--color-bg-secondary);
	}

	.clear-button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>

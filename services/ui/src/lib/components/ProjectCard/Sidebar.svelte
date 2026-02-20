<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let sections: Array<{ id: string; label: string; icon: string }>;
	export let activeSection: string;

	const dispatch = createEventDispatcher();

	function selectSection(sectionId: string) {
		dispatch('sectionChange', sectionId);
	}
</script>

<div class="sidebar">
	<nav class="section-nav" aria-label="Documentation sections">
		{#each sections as section}
			<button
				class="section-button"
				class:active={activeSection === section.id}
				on:click={() => selectSection(section.id)}
				aria-current={activeSection === section.id ? 'page' : undefined}
				aria-label={`${section.label} section`}
			>
				<span class="section-icon" aria-hidden="true">{section.icon}</span>
				<span class="section-label">{section.label}</span>
			</button>
		{/each}
	</nav>
</div>

<style>
	.sidebar {
		width: 240px;
		background: white;
		border-right: 1px solid #e5e7eb;
		overflow-y: auto;
		flex-shrink: 0;
	}

	.section-nav {
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
	}

	.section-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		border: none;
		background: none;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		font-size: 0.875rem;
		color: #6b7280;
		width: 100%;
		outline: none;
	}

	.section-button:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.section-button:focus {
		background: #f3f4f6;
		color: #111827;
		box-shadow: inset 0 0 0 2px #667eea;
	}

	.section-button.active {
		background: linear-gradient(90deg, #667eea15 0%, transparent 100%);
		color: #667eea;
		font-weight: 600;
		border-right: 3px solid #667eea;
	}

	.section-button.active:focus {
		box-shadow: inset 0 0 0 2px #667eea;
	}

	.section-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.section-label {
		flex: 1;
	}

	/* Scrollbar styling */
	.sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar::-webkit-scrollbar-track {
		background: #f9fafb;
	}

	.sidebar::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}

	.sidebar::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	/* Mobile responsive design */
	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid #e5e7eb;
			overflow-x: auto;
			overflow-y: hidden;
			flex-shrink: 0;
		}

		.section-nav {
			flex-direction: row;
			padding: 0;
			gap: 0;
		}

		.section-button {
			flex-direction: column;
			padding: 0.75rem 1rem;
			gap: 0.25rem;
			min-width: 80px;
			flex-shrink: 0;
			font-size: 0.75rem;
			white-space: nowrap;
		}

		.section-button.active {
			border-right: none;
			border-bottom: 3px solid #667eea;
		}

		.section-icon {
			font-size: 1.5rem;
		}

		/* Hide scrollbar on mobile for cleaner look */
		.sidebar::-webkit-scrollbar {
			height: 3px;
		}
	}

	@media (max-width: 480px) {
		.section-button {
			min-width: 70px;
			padding: 0.5rem 0.75rem;
		}

		.section-icon {
			font-size: 1.25rem;
		}

		.section-label {
			font-size: 0.7rem;
		}
	}
</style>

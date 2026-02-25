<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StagedKanban from '$lib/components/StagedKanban.svelte';
	import CreateModal from '$lib/components/CreateModal.svelte';
	import type { PlanningRun, KanbanCard } from '$lib/types';

	interface PageData {
		runs: PlanningRun[];
		error: string | null;
	}

	// eslint-disable-next-line no-undef
	const data = $derived($page.data as PageData);

	// eslint-disable-next-line no-undef
	let showCreateModal = $state(false);

	// eslint-disable-next-line no-inner-declarations
	async function handleCreateRun(data: {
		type: 'idea' | 'run';
		idea: string;
		mode?: 'local' | 'cloud';
	}) {
		// eslint-disable-next-line no-undef
		const res = await fetch('/api/public/planning/runs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ idea: data.idea, mode: data.mode ?? 'cloud' })
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.error ?? 'Failed to create run');
		}

		// Reload page to show new run
		// eslint-disable-next-line no-undef
		window.location.reload();
	}

	// Filter out killed runs (they go to Parked Ideas page)
	// eslint-disable-next-line no-undef
	const activeRuns = $derived(
		data.runs.filter((r) => r.status !== 'killed' && r.status !== 'cancelled')
	);

	// Map runs to Kanban cards based on their current_phase
	// eslint-disable-next-line no-undef
	const cards = $derived<KanbanCard[]>(
		activeRuns.map((run) => {
			// Use current_phase if available, otherwise "opportunity" for new runs
			const phase = run.current_phase ?? 'opportunity';

			return {
				id: run.id,
				title: run.refined_idea ?? run.idea,
				subtitle:
					run.status === 'paused'
						? '⏸ Paused'
						: run.status === 'completed'
							? '✓ Completed'
							: undefined,
				status: phase,
				phase: run.current_phase,
				mode: run.mode ?? 'cloud',
				metadata: {
					quality_score: run.quality_score,
					revenue_potential: run.revenue_potential,
					kill_verdict: run.kill_verdict
				},
				createdAt: run.created_at
			};
		})
	);

	// eslint-disable-next-line no-inner-declarations
	function handleCardClick(card: KanbanCard) {
		// Navigate directly to the detail page
		goto(`/ai-labs/research/runs/${card.id}`);
	}
</script>

<svelte:head>
	<title>Research | ERLV Inc</title>
</svelte:head>

<div class="page-header">
	<div class="header-content">
		<div>
			<h1>Research Pipeline</h1>
			<p class="subtitle">
				5-stage validation: Discovery → Validation → Strategy → Design → Execution
			</p>
		</div>
		<button class="start-research-btn" onclick={() => (showCreateModal = true)}>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Start Research
		</button>
	</div>
</div>

{#if data.error}
	<div class="error-container">
		<p class="error">{data.error}</p>
		<p class="error-hint">Showing pipeline layout with current available data.</p>
	</div>
{/if}

<StagedKanban {cards} onCardClick={handleCardClick} />

<CreateModal
	open={showCreateModal}
	onClose={() => (showCreateModal = false)}
	onSubmit={handleCreateRun}
/>

<style>
	.page-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
	}

	.start-research-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.start-research-btn:hover {
		background: var(--color-primary-hover, #7c3aed);
		transform: translateY(-1px);
	}

	.start-research-btn svg {
		flex-shrink: 0;
	}

	.error-container {
		padding: 1rem 1.5rem;
		margin: 1rem 1.5rem 0;
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-error) 8%, transparent);
	}

	.error {
		color: var(--color-error);
		font-size: 0.875rem;
		margin: 0;
	}

	.error-hint {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
	}
</style>

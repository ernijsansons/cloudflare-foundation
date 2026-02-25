<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import CreateModal from '$lib/components/CreateModal.svelte';
	import ProjectCard from '$lib/components/ProjectKanban/ProjectCard.svelte';
	import { phaseDocs } from '$lib/data/phase-docs';
	import type { ProjectSummary, ProjectKanbanCard } from '$lib/types/project';
	import { projectToKanbanCard } from '$lib/types/project';

	interface PageData {
		projects: ProjectSummary[];
		error: string | null;
	}

	const data = $derived($page.data as PageData);

	let showCreateModal = $state(false);

	async function handleCreateRun(runData: {
		type: 'idea' | 'run';
		idea: string;
		mode?: 'local' | 'cloud';
	}) {
		const res = await fetch('/api/public/planning/runs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ idea: runData.idea, mode: runData.mode ?? 'cloud' })
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.error ?? 'Failed to create run');
		}

		// Reload page to show new project
		window.location.reload();
	}

	// Filter out killed/cancelled projects for board view
	const activeProjects = $derived(
		data.projects.filter((p) => p.status !== 'killed' && p.status !== 'cancelled')
	);

	// Convert projects to Kanban cards
	const cards = $derived<ProjectKanbanCard[]>(
		activeProjects.map((project) => projectToKanbanCard(project))
	);

	// Define the 5 stages with their phases
	const stages = [
		{
			id: 'discovery',
			name: 'Discovery',
			description: 'Market validation & opportunity assessment',
			phases: ['opportunity', 'customer-intel', 'market-research', 'competitive-intel'],
			color: '#8b5cf6' // Violet
		},
		{
			id: 'validation',
			name: 'Validation',
			description: 'Critical go/no-go decision',
			phases: ['kill-test'],
			color: '#ef4444' // Red
		},
		{
			id: 'strategy',
			name: 'Strategy',
			description: 'Business model & strategic planning',
			phases: ['revenue-expansion', 'strategy', 'business-model'],
			color: '#3b82f6' // Blue
		},
		{
			id: 'design',
			name: 'Design',
			description: 'Product & go-to-market design',
			phases: ['product-design', 'gtm-marketing', 'content-engine'],
			color: '#f59e0b' // Amber
		},
		{
			id: 'execution',
			name: 'Execution',
			description: 'Technical architecture & launch',
			phases: ['tech-arch', 'analytics', 'launch-execution', 'synthesis', 'task-reconciliation'],
			color: '#10b981' // Green
		}
	];

	const stageEmptyGuidance: Record<
		string,
		{ headline: string; description: string; tip: string }
	> = {
		discovery: {
			headline: 'No projects in discovery',
			description: 'Validate demand first. Start with problem framing and market signal checks.',
			tip: 'Tip: Click "Start Research" to begin validating a new idea.'
		},
		validation: {
			headline: 'No projects in validation',
			description: 'Kill Test is your gate. Use it to prevent weak ideas from moving forward.',
			tip: 'Tip: Move only top-scoring discovery projects into validation.'
		},
		strategy: {
			headline: 'No projects in strategy',
			description: 'Define business model and expansion path before design execution.',
			tip: 'Tip: Enter strategy only after a clear go decision from validation.'
		},
		design: {
			headline: 'No projects in design',
			description: 'Translate strategy into product, GTM, and content plans.',
			tip: 'Tip: Lock core positioning in strategy before moving here.'
		},
		execution: {
			headline: 'No projects in execution',
			description: 'Architecture, launch and synthesis happen once design is stable.',
			tip: 'Tip: Promote only decision-ready projects to avoid delivery thrash.'
		}
	};

	let activeStageIndex = $state(0);

	function getCardsForPhase(phase: string): ProjectKanbanCard[] {
		return cards.filter((card) => card.status === phase);
	}

	function getTotalCardsForStage(stageIndex: number): number {
		const stage = stages[stageIndex];
		return stage.phases.reduce((total, phase) => {
			return total + getCardsForPhase(phase).length;
		}, 0);
	}

	function isStageEmpty(stageIndex: number): boolean {
		return getTotalCardsForStage(stageIndex) === 0;
	}

	function formatPhaseTitle(phase: string): string {
		return (
			phaseDocs[phase as keyof typeof phaseDocs]?.title
				.replace(' Analysis', '')
				.replace(' Intelligence', '')
				.replace(' & Marketing', '')
				.replace(' & Metrics', '') || phase
		);
	}

	function handleCardClick(card: ProjectKanbanCard) {
		// Navigate to Master Bible project page
		goto(`/ai-labs/research/projects/${card.id}`);
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

<div class="staged-kanban">
	<!-- Stage Tabs -->
	<div class="stage-tabs">
		{#each stages as stage, index}
			<button
				class="stage-tab"
				class:active={activeStageIndex === index}
				style="--stage-color: {stage.color}"
				onclick={() => (activeStageIndex = index)}
			>
				<div class="stage-tab-header">
					<span class="stage-name">{stage.name}</span>
					<span class="stage-count">{getTotalCardsForStage(index)}</span>
				</div>
				<div class="stage-description">{stage.description}</div>
			</button>
		{/each}
	</div>

	<!-- Active Stage Kanban -->
	{#each stages as stage, index}
		{#if activeStageIndex === index}
			{#if isStageEmpty(index)}
				<div class="stage-empty">
					<div class="stage-empty-card" style="--stage-color: {stage.color}">
						<div class="stage-empty-badge">{stage.name} is Empty</div>
						<h3>{stageEmptyGuidance[stage.id]?.headline}</h3>
						<p class="stage-empty-description">
							{stageEmptyGuidance[stage.id]?.description}
						</p>
						<div class="stage-empty-phases">
							{#each stage.phases as phase}
								<span class="phase-chip">{formatPhaseTitle(phase)}</span>
							{/each}
						</div>
						<p class="stage-empty-tip">{stageEmptyGuidance[stage.id]?.tip}</p>
					</div>
				</div>
			{:else}
				<div class="kanban-board">
					{#each stage.phases as phase}
						{@const phaseCards = getCardsForPhase(phase)}
						<div class="kanban-column">
							<div class="column-header" style="border-color: {stage.color}">
								<h3 class="column-title">{formatPhaseTitle(phase)}</h3>
								<span class="column-count">{phaseCards.length}</span>
							</div>
							<div class="column-cards">
								{#if phaseCards.length === 0}
									<div class="empty-column">
										<svg
											width="28"
											height="28"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
										>
											<rect x="3" y="3" width="18" height="18" rx="2" />
											<line x1="9" y1="9" x2="15" y2="15" />
											<line x1="15" y1="9" x2="9" y2="15" />
										</svg>
										<p class="empty-title">No projects here</p>
										<p class="empty-subtitle">Projects will appear here automatically.</p>
									</div>
								{:else}
									{#each phaseCards as card}
										<ProjectCard
											project={card}
											onclick={() => handleCardClick(card)}
										/>
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/each}
</div>

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

	/* Staged Kanban Styles */
	.staged-kanban {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 140px);
	}

	.stage-tabs {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		overflow-x: auto;
	}

	.stage-tab {
		flex: 1;
		min-width: 180px;
		padding: 0.875rem 1rem;
		background: white;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.stage-tab:hover {
		border-color: var(--stage-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.stage-tab.active {
		border-color: var(--stage-color);
		background: var(--stage-color);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stage-tab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.stage-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.stage-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.375rem;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.stage-tab.active .stage-count {
		background: rgba(255, 255, 255, 0.25);
	}

	.stage-description {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.kanban-board {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		overflow-x: auto;
		flex: 1;
		align-items: flex-start;
	}

	.stage-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 2rem 1.5rem;
	}

	.stage-empty-card {
		width: min(860px, 100%);
		border: 1px solid color-mix(in srgb, var(--stage-color) 30%, transparent);
		border-radius: 16px;
		padding: 2rem;
		background:
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--stage-color) 12%, #fff) 0%,
				color-mix(in srgb, var(--stage-color) 4%, #fff) 100%
			);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
	}

	.stage-empty-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--stage-color);
		background: color-mix(in srgb, var(--stage-color) 12%, #fff);
		border: 1px solid color-mix(in srgb, var(--stage-color) 24%, transparent);
		margin-bottom: 0.85rem;
	}

	.stage-empty-card h3 {
		margin: 0;
		font-size: 1.35rem;
		color: var(--color-text);
	}

	.stage-empty-description {
		margin: 0.6rem 0 1rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		max-width: 65ch;
	}

	.stage-empty-phases {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.phase-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text);
		background: white;
		border: 1px solid color-mix(in srgb, var(--stage-color) 20%, var(--color-border));
	}

	.stage-empty-tip {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.kanban-column {
		flex: 1;
		min-width: 300px;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		background: var(--color-bg-subtle);
		border-radius: 8px;
		overflow: hidden;
	}

	.column-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem 1rem;
		background: white;
		border-left: 3px solid;
	}

	.column-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.column-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.375rem;
		background: var(--color-bg-subtle);
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.column-cards {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		max-height: calc(100vh - 320px);
	}

	.empty-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		color: var(--color-text-muted);
		opacity: 0.8;
		border: 1px dashed var(--color-border);
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-bg-subtle) 92%, white);
	}

	.empty-column svg {
		margin-bottom: 0.5rem;
	}

	.empty-title {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.empty-subtitle {
		margin: 0.35rem 0 0;
		font-size: 0.75rem;
		text-align: center;
		line-height: 1.4;
	}

	/* Scrollbar styling */
	.stage-tabs::-webkit-scrollbar,
	.kanban-board::-webkit-scrollbar,
	.column-cards::-webkit-scrollbar {
		height: 6px;
		width: 6px;
	}

	.stage-tabs::-webkit-scrollbar-track,
	.kanban-board::-webkit-scrollbar-track,
	.column-cards::-webkit-scrollbar-track {
		background: transparent;
	}

	.stage-tabs::-webkit-scrollbar-thumb,
	.kanban-board::-webkit-scrollbar-thumb,
	.column-cards::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 3px;
	}

	.stage-tabs::-webkit-scrollbar-thumb:hover,
	.kanban-board::-webkit-scrollbar-thumb:hover,
	.column-cards::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-muted);
	}

	@media (max-width: 900px) {
		.stage-empty {
			padding: 1.25rem 1rem;
		}

		.stage-empty-card {
			padding: 1.25rem;
			border-radius: 12px;
		}

		.stage-empty-card h3 {
			font-size: 1.1rem;
		}
	}
</style>

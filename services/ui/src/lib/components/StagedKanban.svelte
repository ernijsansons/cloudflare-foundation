<script lang="ts">
	import type { KanbanCard } from '$lib/types';
	import { phaseDocs } from '$lib/data/phase-docs';

	interface Props {
		cards: KanbanCard[];
		// eslint-disable-next-line no-unused-vars
		onCardClick?: (card: KanbanCard) => void;
	}

	// eslint-disable-next-line no-undef
	let { cards, onCardClick }: Props = $props();

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

	// eslint-disable-next-line no-undef
	let activeStageIndex = $state(0);

	// Get cards for a specific phase
	// eslint-disable-next-line no-inner-declarations
	function getCardsForPhase(phase: string): KanbanCard[] {
		return cards.filter((card) => card.status === phase);
	}

	// Get total cards for a stage
	// eslint-disable-next-line no-inner-declarations
	function getTotalCardsForStage(stageIndex: number): number {
		const stage = stages[stageIndex];
		return stage.phases.reduce((total, phase) => {
			return total + getCardsForPhase(phase).length;
		}, 0);
	}

	// Format phase title for display
	// eslint-disable-next-line no-inner-declarations
	function formatPhaseTitle(phase: string): string {
		return (
			phaseDocs[phase as keyof typeof phaseDocs]?.title
				.replace(' Analysis', '')
				.replace(' Intelligence', '')
				.replace(' & Marketing', '')
				.replace(' & Metrics', '') || phase
		);
	}
</script>

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
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
									>
										<rect x="3" y="3" width="18" height="18" rx="2" />
										<line x1="9" y1="9" x2="15" y2="15" />
										<line x1="15" y1="9" x2="9" y2="15" />
									</svg>
									<p>No runs</p>
								</div>
							{:else}
								{#each phaseCards as card}
									<button class="kanban-card" onclick={() => onCardClick?.(card)}>
										<div class="card-header">
											<h4 class="card-title">{card.title}</h4>
											{#if card.mode}
												<span class="card-mode" class:local={card.mode === 'local'}>
													{card.mode === 'local' ? '🏠' : '☁️'}
												</span>
											{/if}
										</div>
										{#if card.subtitle}
											<p class="card-subtitle">{card.subtitle}</p>
										{/if}
										{#if card.metadata}
											<div class="card-metadata">
												{#if card.metadata.quality_score}
													<span class="metadata-item">
														Score: {card.metadata.quality_score}
													</span>
												{/if}
												{#if card.metadata.revenue_potential}
													<span class="metadata-item">
														{card.metadata.revenue_potential}
													</span>
												{/if}
											</div>
										{/if}
									</button>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/each}
</div>

<style>
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

	.kanban-column {
		flex: 1;
		min-width: 280px;
		max-width: 320px;
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
		opacity: 0.5;
	}

	.empty-column svg {
		margin-bottom: 0.5rem;
	}

	.empty-column p {
		margin: 0;
		font-size: 0.8125rem;
	}

	.kanban-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.kanban-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.card-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		line-height: 1.4;
		flex: 1;
	}

	.card-mode {
		font-size: 1rem;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.card-mode.local {
		opacity: 0.8;
	}

	.card-subtitle {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.card-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.metadata-item {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-bg-subtle);
		border-radius: 4px;
		color: var(--color-text-muted);
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
</style>

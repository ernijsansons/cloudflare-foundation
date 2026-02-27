<script lang="ts">
	interface ModelOutput {
		phase?: string;
		model: string;
		response: string;
		latency_ms: number;
		tokens_used: number;
	}

	interface Props {
		outputs: ModelOutput[];
		synthesizerModel?: string;
		consensusMethod?: string;
		byPhase?: Record<string, ModelOutput[]>;
	}

	let {
		outputs,
		synthesizerModel = 'claude-sonnet-4-20250514',
		consensusMethod = 'multi-model-orchestration',
		byPhase = {}
	}: Props = $props();

	let selectedPhase = $state<string | null>(null);
	let expandedModel = $state<string | null>(null);

	const phases = $derived(() => Object.keys(byPhase));

	const displayOutputs = $derived(() => {
		if (selectedPhase && byPhase[selectedPhase]) {
			return byPhase[selectedPhase];
		}
		return outputs;
	});

	const stats = $derived(() => {
		const allOutputs = outputs;
		if (allOutputs.length === 0)
			return { avgLatency: 0, totalTokens: 0, modelCount: 0, phaseCount: 0 };

		const totalLatency = allOutputs.reduce((sum, o) => sum + o.latency_ms, 0);
		const totalTokens = allOutputs.reduce((sum, o) => sum + o.tokens_used, 0);
		const uniqueModels = new Set(allOutputs.map((o) => o.model));

		return {
			avgLatency: Math.round(totalLatency / allOutputs.length),
			totalTokens,
			modelCount: uniqueModels.size,
			phaseCount: phases().length
		};
	});

	function formatLatency(ms: number): string {
		if (ms >= 1000) {
			return `${(ms / 1000).toFixed(2)}s`;
		}
		return `${ms}ms`;
	}

	function formatTokens(tokens: number): string {
		if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}k`;
		}
		return tokens.toString();
	}

	function getModelColor(model: string): string {
		const colors: Record<string, string> = {
			'claude-sonnet-4-20250514': '#6366f1',
			'claude-3-5-sonnet': '#8b5cf6',
			'gpt-4': '#10b981',
			'gpt-4-turbo': '#059669',
			'llama-3.1-70b-instruct': '#f59e0b',
			'meta-llama': '#f59e0b',
			'deepseek': '#3b82f6',
			'kimi': '#ec4899',
			'glm': '#06b6d4'
		};

		for (const [key, color] of Object.entries(colors)) {
			if (model.toLowerCase().includes(key.toLowerCase())) {
				return color;
			}
		}
		return '#6b7280';
	}

	function toggleModel(model: string) {
		expandedModel = expandedModel === model ? null : model;
	}

	function truncateResponse(response: string, maxLength = 200): string {
		if (response.length <= maxLength) return response;
		return response.slice(0, maxLength) + '...';
	}
</script>

<div class="orchestration-panel">
	<div class="panel-header">
		<h3 class="panel-title">Model Orchestration</h3>
		<div class="panel-meta">
			<span class="consensus-badge">{consensusMethod}</span>
			<span class="synthesizer">Synth: {synthesizerModel.split('-').slice(-2).join('-')}</span>
		</div>
	</div>

	<!-- Stats Summary -->
	<div class="stats-grid">
		<div class="stat-item">
			<span class="stat-value">{stats().modelCount}</span>
			<span class="stat-label">Models</span>
		</div>
		<div class="stat-item">
			<span class="stat-value">{stats().phaseCount}</span>
			<span class="stat-label">Phases</span>
		</div>
		<div class="stat-item">
			<span class="stat-value">{formatLatency(stats().avgLatency)}</span>
			<span class="stat-label">Avg Latency</span>
		</div>
		<div class="stat-item">
			<span class="stat-value">{formatTokens(stats().totalTokens)}</span>
			<span class="stat-label">Total Tokens</span>
		</div>
	</div>

	<!-- Phase Filter -->
	{#if phases().length > 0}
		<div class="phase-filter">
			<button
				class="phase-btn"
				class:active={selectedPhase === null}
				onclick={() => (selectedPhase = null)}
				type="button"
			>
				All
			</button>
			{#each phases() as phase}
				<button
					class="phase-btn"
					class:active={selectedPhase === phase}
					onclick={() => (selectedPhase = phase)}
					type="button"
				>
					{phase}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Model Outputs -->
	<div class="outputs-list">
		{#each displayOutputs() as output}
			<button
				class="output-card"
				class:expanded={expandedModel === output.model + (output.phase || '')}
				onclick={() => toggleModel(output.model + (output.phase || ''))}
				type="button"
			>
				<div class="output-header">
					<div class="model-info">
						<span class="model-indicator" style="background: {getModelColor(output.model)}"></span>
						<span class="model-name">{output.model}</span>
						{#if output.phase && selectedPhase === null}
							<span class="phase-tag">{output.phase}</span>
						{/if}
					</div>
					<div class="output-metrics">
						<span class="metric">
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
							{formatLatency(output.latency_ms)}
						</span>
						<span class="metric">
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
							{formatTokens(output.tokens_used)}
						</span>
					</div>
				</div>

				<div class="output-preview">
					{#if expandedModel === output.model + (output.phase || '')}
						<pre class="response-full">{output.response}</pre>
					{:else}
						<p class="response-truncated">{truncateResponse(output.response)}</p>
					{/if}
				</div>

				<span class="expand-hint">
					{expandedModel === output.model + (output.phase || '') ? 'Click to collapse' : 'Click to expand'}
				</span>
			</button>
		{/each}

		{#if displayOutputs().length === 0}
			<div class="empty-state">
				<span class="empty-icon">🤖</span>
				<p>No model outputs available</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.orchestration-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.panel-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.panel-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.consensus-badge {
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		padding: 0.125rem 0.5rem;
		background: var(--gradient-brand);
		color: white;
		border-radius: 4px;
	}

	.synthesizer {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 6px;
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text, #111827);
	}

	.stat-label {
		font-size: 0.6875rem;
		color: var(--color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.phase-filter {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.phase-btn {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-transform: capitalize;
	}

	.phase-btn:hover {
		border-color: var(--color-primary, #6366f1);
	}

	.phase-btn.active {
		background: var(--color-primary, #6366f1);
		border-color: var(--color-primary, #6366f1);
		color: white;
	}

	.outputs-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 500px;
		overflow-y: auto;
	}

	.output-card {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.output-card:hover {
		border-color: var(--color-primary, #6366f1);
	}

	.output-card.expanded {
		background: var(--color-bg-tertiary, #f3f4f6);
	}

	.output-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.model-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.model-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.model-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.phase-tag {
		font-size: 0.625rem;
		font-weight: 500;
		text-transform: capitalize;
		padding: 0.0625rem 0.375rem;
		background: var(--color-bg-tertiary, #f3f4f6);
		border-radius: 3px;
		color: var(--color-text-muted, #6b7280);
	}

	.output-metrics {
		display: flex;
		gap: 0.75rem;
	}

	.metric {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.output-preview {
		margin-bottom: 0.375rem;
	}

	.response-truncated {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
		line-height: 1.5;
	}

	.response-full {
		margin: 0;
		font-size: 0.75rem;
		font-family: var(--font-mono, monospace);
		color: var(--color-text, #111827);
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
		padding: 0.75rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 4px;
		max-height: 300px;
		overflow-y: auto;
	}

	.expand-hint {
		font-size: 0.6875rem;
		color: var(--color-text-subtle, #9ca3af);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (prefers-color-scheme: dark) {
		.stat-item,
		.phase-btn,
		.output-card {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.output-card.expanded,
		.response-full {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>

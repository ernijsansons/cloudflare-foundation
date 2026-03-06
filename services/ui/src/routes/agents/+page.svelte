<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Organize agents by role
	const rootAgents = $derived(data.agents.filter((a: any) => a.role === 'root'));
	const managers = $derived(data.agents.filter((a: any) => a.role === 'manager'));
	const workers = $derived(data.agents.filter((a: any) => a.role === 'worker'));

	// Source tabs
	const sources = ['all', 'naomi', 'athena'] as const;
	type SourceFilter = (typeof sources)[number];

	function getSourceLabel(source: SourceFilter): string {
		if (source === 'all') return 'All Agents';
		if (source === 'naomi') return `Naomi (${data.sources.naomi.count})`;
		if (source === 'athena') return `Athena (${data.sources.athena.count})`;
		return source;
	}

	function isSourceEnabled(source: SourceFilter): boolean {
		if (source === 'all') return true;
		return data.sources[source]?.enabled ?? false;
	}

	function isSourceHealthy(source: SourceFilter): boolean {
		if (source === 'all') return data.sources.naomi.healthy || data.sources.athena.healthy;
		return data.sources[source]?.healthy ?? false;
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'root':
				return 'var(--color-purple)';
			case 'manager':
				return 'var(--color-blue)';
			case 'worker':
				return 'var(--color-green)';
			default:
				return 'var(--color-text-muted)';
		}
	}

	function getSourceColor(source: string): string {
		switch (source) {
			case 'naomi':
				return 'var(--color-purple)';
			case 'athena':
				return 'var(--color-blue)';
			default:
				return 'var(--color-text-muted)';
		}
	}

	function getAutonomyColor(level: string): string {
		switch (level) {
			case 'auto':
				return 'var(--color-green)';
			case 'semi_auto':
				return 'var(--color-blue)';
			case 'supervised':
				return 'var(--color-orange)';
			case 'manual_review':
				return 'var(--color-red)';
			default:
				return 'var(--color-text-muted)';
		}
	}

	function formatAutonomy(level: string): string {
		if (!level) return 'Auto';
		return level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	function getAgentDetailUrl(agent: any): string {
		// Use the detail_url from the agent if available, otherwise construct it
		if (agent.detail_url) return agent.detail_url;
		return `/agents/${agent.source}/${agent.id}`;
	}
</script>

<svelte:head>
	<title>Agent Hierarchy | Dashboard</title>
</svelte:head>

<div class="agents-page">
	<header class="page-header">
		<h1>Agent Hierarchy</h1>
		<p class="subtitle">
			Multi-agent AI systems with hierarchical delegation and coordination
		</p>
	</header>

	<!-- Source Tabs -->
	<nav class="source-tabs">
		{#each sources as source}
			<a
				href="/agents?source={source}"
				class="source-tab"
				class:active={data.currentSource === source}
				class:disabled={!isSourceEnabled(source)}
			>
				<span class="tab-label">{getSourceLabel(source)}</span>
				{#if source !== 'all'}
					<span
						class="health-indicator"
						class:healthy={isSourceHealthy(source)}
						class:unhealthy={isSourceEnabled(source) && !isSourceHealthy(source)}
						class:disabled={!isSourceEnabled(source)}
					></span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Source Status -->
	<div class="source-status">
		{#if data.sources.naomi.enabled}
			<span class="status-badge naomi" class:healthy={data.sources.naomi.healthy}>
				Naomi: {data.sources.naomi.healthy ? 'Connected' : 'Disconnected'}
			</span>
		{/if}
		{#if data.sources.athena.enabled}
			<span class="status-badge athena" class:healthy={data.sources.athena.healthy}>
				Athena: {data.sources.athena.healthy ? 'Connected' : 'Disconnected'}
			</span>
		{/if}
	</div>

	{#if data.error}
		<div class="error-banner">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<span>{data.error}</span>
		</div>
	{/if}

	<!-- Root Agents (Chiefs of Staff) -->
	{#if rootAgents.length > 0}
		<section class="agent-section">
			<h2 class="section-title">Chiefs of Staff ({rootAgents.length})</h2>
			<div class="agent-card-grid" class:single={rootAgents.length === 1}>
				{#each rootAgents as agent}
					<a href={getAgentDetailUrl(agent)} class="agent-card chief" class:naomi-source={agent.source === 'naomi'} class:athena-source={agent.source === 'athena'}>
						<div class="agent-header">
							<div class="agent-icon chief">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path
										d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
									/>
								</svg>
							</div>
							<div class="agent-identity">
								<h3>{agent.name || agent.id}</h3>
								<div class="badge-row">
									<span class="role-badge" style="background-color: {getRoleColor(agent.role)};">
										{agent.role}
									</span>
									<span class="source-badge" style="background-color: {getSourceColor(agent.source)};">
										{agent.source}
									</span>
								</div>
							</div>
						</div>

						<div class="agent-metrics">
							{#if agent.reliability_score != null}
								<div class="metric">
									<span class="metric-label">Reliability</span>
									<div class="metric-bar-container">
										<div class="metric-bar" style="width: {agent.reliability_score}%"></div>
									</div>
									<span class="metric-value">{agent.reliability_score.toFixed(1)}%</span>
								</div>
							{/if}

							{#if agent.hallucination_risk != null}
								<div class="metric">
									<span class="metric-label">Hallucination Risk</span>
									<span class="metric-value danger">{agent.hallucination_risk.toFixed(1)}%</span>
								</div>
							{/if}

							<div class="metric">
								<span class="metric-label">Autonomy</span>
								<span
									class="metric-value"
									style="color: {getAutonomyColor(agent.autonomy_level || 'auto')};"
								>
									{formatAutonomy(agent.autonomy_level || 'auto')}
								</span>
							</div>
						</div>

						<div class="agent-capabilities">
							{#if agent.can_delegate}
								<span class="capability-badge">Can Delegate</span>
							{/if}
							{#if agent.can_execute}
								<span class="capability-badge">Can Execute</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Department Managers -->
	{#if managers.length > 0}
		<section class="agent-section">
			<h2 class="section-title">Department Managers ({managers.length})</h2>
			<div class="agent-card-grid">
				{#each managers as agent}
					<a href={getAgentDetailUrl(agent)} class="agent-card manager" class:naomi-source={agent.source === 'naomi'} class:athena-source={agent.source === 'athena'}>
						<div class="agent-header">
							<div class="agent-icon manager">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
									<path d="M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
							</div>
							<div class="agent-identity">
								<h3>{agent.name || agent.id}</h3>
								<div class="badge-row">
									<p class="department-label">{agent.department || 'No department'}</p>
									<span class="source-badge small" style="background-color: {getSourceColor(agent.source)};">
										{agent.source}
									</span>
								</div>
							</div>
						</div>

						<div class="agent-metrics">
							{#if agent.reliability_score != null}
								<div class="metric">
									<span class="metric-label">Reliability</span>
									<div class="metric-bar-container">
										<div class="metric-bar" style="width: {agent.reliability_score}%"></div>
									</div>
									<span class="metric-value">{agent.reliability_score.toFixed(1)}%</span>
								</div>
							{/if}

							{#if agent.hallucination_risk != null}
								<div class="metric">
									<span class="metric-label">Hallucination Risk</span>
									<span class="metric-value danger">{agent.hallucination_risk.toFixed(1)}%</span>
								</div>
							{/if}

							<div class="metric">
								<span class="metric-label">Autonomy</span>
								<span class="metric-value" style="color: {getAutonomyColor(agent.autonomy_level || 'auto')};">
									{formatAutonomy(agent.autonomy_level || 'auto')}
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Worker Agents -->
	{#if workers.length > 0}
		<section class="agent-section">
			<h2 class="section-title">Worker Agents ({workers.length})</h2>
			<div class="agent-card-grid">
				{#each workers as agent}
					<a href={getAgentDetailUrl(agent)} class="agent-card worker" class:naomi-source={agent.source === 'naomi'} class:athena-source={agent.source === 'athena'}>
						<div class="agent-header">
							<div class="agent-icon worker">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
									<circle cx="12" cy="7" r="4" />
								</svg>
							</div>
							<div class="agent-identity">
								<h3>{agent.name || agent.id}</h3>
								<div class="badge-row">
									<p class="department-label">{agent.department || 'No department'}</p>
									<span class="source-badge small" style="background-color: {getSourceColor(agent.source)};">
										{agent.source}
									</span>
								</div>
							</div>
						</div>

						<div class="agent-metrics compact">
							{#if agent.reliability_score != null}
								<div class="metric">
									<span class="metric-label">Reliability</span>
									<span class="metric-value">{agent.reliability_score.toFixed(1)}%</span>
								</div>
							{/if}
							{#if agent.hallucination_risk != null}
								<div class="metric">
									<span class="metric-label">Risk</span>
									<span class="metric-value danger">{agent.hallucination_risk.toFixed(1)}%</span>
								</div>
							{/if}
							<div class="metric">
								<span class="metric-label">Autonomy</span>
								<span class="metric-value" style="color: {getAutonomyColor(agent.autonomy_level || 'auto')};">
									{formatAutonomy(agent.autonomy_level || 'auto')}
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.agents.length === 0 && !data.error}
		<div class="empty-state">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="16" x2="12" y2="12" />
				<line x1="12" y1="8" x2="12.01" y2="8" />
			</svg>
			<p>No agents found</p>
			<p class="empty-subtitle">
				Agents will appear here once the Naomi system is initialized
			</p>
		</div>
	{/if}
</div>

<style>
	.agents-page {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: color-mix(in srgb, var(--color-red) 10%, transparent);
		border: 1px solid var(--color-red);
		border-radius: 8px;
		color: var(--color-red);
		margin-bottom: 1.5rem;
	}

	.agent-section {
		margin-bottom: 3rem;
	}

	.section-title {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.agent-card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	.agent-card-grid.single {
		grid-template-columns: 1fr;
		max-width: 600px;
	}

	.agent-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		text-decoration: none;
		color: var(--color-text);
		transition: all var(--transition-fast);
	}

	.agent-card:hover {
		border-color: var(--color-border-focus);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.agent-card.chief {
		border-color: var(--color-purple);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-purple) 5%, transparent),
			var(--color-bg-secondary)
		);
	}

	.agent-card.manager {
		border-left: 3px solid var(--color-blue);
	}

	.agent-card.worker {
		border-left: 3px solid var(--color-green);
	}

	.agent-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.agent-icon {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.agent-icon.chief {
		background: color-mix(in srgb, var(--color-purple) 15%, transparent);
		color: var(--color-purple);
	}

	.agent-icon.manager {
		background: color-mix(in srgb, var(--color-blue) 15%, transparent);
		color: var(--color-blue);
	}

	.agent-icon.worker {
		background: color-mix(in srgb, var(--color-green) 15%, transparent);
		color: var(--color-green);
	}

	.agent-identity h3 {
		margin: 0 0 0.25rem;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.role-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.department-label {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		text-transform: capitalize;
	}

	.agent-metrics {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.agent-metrics.compact {
		flex-direction: row;
		justify-content: space-between;
	}

	.metric {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.metric-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.metric-bar-container {
		flex: 1;
		height: 6px;
		background: var(--color-bg-tertiary);
		border-radius: 3px;
		overflow: hidden;
	}

	.metric-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--color-green), var(--color-blue));
		transition: width var(--transition-normal);
	}

	.metric-value {
		font-size: 0.875rem;
		font-weight: 600;
		min-width: 3rem;
		text-align: right;
	}

	.metric-value.danger {
		color: var(--color-red);
	}

	.agent-capabilities {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.capability-badge {
		padding: 0.25rem 0.75rem;
		background: var(--color-bg-tertiary);
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.incident-warning {
		padding: 0.5rem;
		background: color-mix(in srgb, var(--color-red) 10%, transparent);
		border-radius: 6px;
		font-size: 0.75rem;
		color: var(--color-red);
		text-align: center;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.empty-state svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.empty-subtitle {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	:root {
		--color-purple: #a855f7;
		--color-blue: #3b82f6;
		--color-green: #10b981;
		--color-orange: #f59e0b;
		--color-red: #ef4444;
	}

	/* Source Tabs */
	.source-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.source-tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		text-decoration: none;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all var(--transition-fast);
	}

	.source-tab:hover:not(.disabled) {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.source-tab.active {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		border-bottom: 2px solid var(--color-purple);
	}

	.source-tab.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.health-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-text-muted);
	}

	.health-indicator.healthy {
		background: var(--color-green);
	}

	.health-indicator.unhealthy {
		background: var(--color-red);
	}

	.health-indicator.disabled {
		background: var(--color-text-muted);
	}

	/* Source Status */
	.source-status {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-badge.naomi {
		background: color-mix(in srgb, var(--color-purple) 15%, transparent);
		color: var(--color-purple);
	}

	.status-badge.athena {
		background: color-mix(in srgb, var(--color-blue) 15%, transparent);
		color: var(--color-blue);
	}

	.status-badge.healthy::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-green);
	}

	.status-badge:not(.healthy)::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-red);
	}

	/* Source Badge */
	.source-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 500;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.source-badge.small {
		padding: 0.15rem 0.4rem;
		font-size: 0.65rem;
	}

	.badge-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Source-specific card styling */
	.agent-card.naomi-source {
		border-left-color: var(--color-purple);
	}

	.agent-card.athena-source {
		border-left-color: var(--color-blue);
	}

	.agent-card.chief.naomi-source {
		border-color: var(--color-purple);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-purple) 5%, transparent),
			var(--color-bg-secondary)
		);
	}

	.agent-card.chief.athena-source {
		border-color: var(--color-blue);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-blue) 5%, transparent),
			var(--color-bg-secondary)
		);
	}
</style>

<script lang="ts">
	import type { SectionH } from '$lib/shared';
	export let data: SectionH | undefined;
</script>

<div class="section-h">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">🚀</div>
			<h3>No GTM Data</h3>
			<p>Section H will be populated during GTM and marketing phases.</p>
		</div>
	{:else}
		<!-- Positioning Statement -->
		<section class="subsection">
			<h2>Positioning Statement</h2>
			<div class="card">
				{#if data.positioning_statement}
					<div class="field">
						<strong>For:</strong>
						{data.positioning_statement.for_icp}
					</div>
					<div class="field">
						<strong>Who need:</strong>
						{data.positioning_statement.who_need}
					</div>
					<div class="field">
						<strong>We provide:</strong>
						{data.positioning_statement.we_provide}
					</div>
					<div class="field">
						<strong>That delivers:</strong>
						{data.positioning_statement.that_delivers}
					</div>
				{/if}
			</div>
		</section>

		<!-- Acquisition Channels -->
		{#if data.acquisition_channels && data.acquisition_channels.length > 0}
			<section class="subsection">
				<h2>Acquisition Channels</h2>
				{#each data.acquisition_channels as channel}
					<div class="card channel-card">
						<div class="channel-header">
							<h3>{channel.channel}</h3>
							<span class="priority">Priority {channel.priority}</span>
						</div>
						<div class="field">
							<strong>Est. CAC:</strong>
							{channel.estimated_cac}
						</div>
						<div class="field">
							<strong>Rationale:</strong>
							{channel.rationale}
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Funnel Metrics -->
		{#if data.funnel_metrics && data.funnel_metrics.length > 0}
			<section class="subsection">
				<h2>Funnel Metrics</h2>
				<table>
					<thead>
						<tr>
							<th>Stage</th>
							<th>Metric</th>
							<th>Target</th>
						</tr>
					</thead>
					<tbody>
						{#each data.funnel_metrics as metric}
							<tr>
								<td>{metric.stage}</td>
								<td>{metric.metric_name}</td>
								<td>{metric.target}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		<!-- Launch Plan -->
		{#if data.launch_plan}
			<section class="subsection">
				<h2>Launch Plan</h2>
				<div class="card">
					<p>{data.launch_plan}</p>
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.section-h {
		max-width: 1000px;
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #6b7280;
	}
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #111827;
	}
	.subsection {
		margin-bottom: 2rem;
	}
	.subsection h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #667eea;
	}
	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}
	.field {
		margin-bottom: 1rem;
	}
	.field strong {
		color: #374151;
		font-weight: 600;
	}

	.channel-card {
		margin-bottom: 1rem;
	}
	.channel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.channel-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #111827;
	}
	.priority {
		background: #667eea;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	thead {
		background: #f9fafb;
	}
	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
	}
	td {
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e7eb;
	}
	tr:hover {
		background: #f9fafb;
	}
</style>

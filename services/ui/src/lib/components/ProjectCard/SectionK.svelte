<script lang="ts">
	import type { SectionK } from '@cloudflare/shared';
	export let data: SectionK | undefined;
</script>

<div class="section-k">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">🧪</div>
			<h3>No Testing Data</h3>
			<p>Section K will be populated during analytics phase.</p>
		</div>
	{:else}
		<!-- Testing Strategy -->
		{#if data.testing_strategy && data.testing_strategy.length > 0}
			<section class="subsection">
				<h2>Testing Strategy</h2>
				<table>
					<thead>
						<tr>
							<th>Test Type</th>
							<th>Coverage Requirement</th>
							<th>Tools</th>
						</tr>
					</thead>
					<tbody>
						{#each data.testing_strategy as test}
							<tr>
								<td><span class="test-type">{test.test_type}</span></td>
								<td>{test.coverage_requirement}</td>
								<td class="tools-cell">{test.tools}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		<!-- Continuous Evals -->
		{#if data.continuous_evaluations && data.continuous_evaluations.length > 0}
			<section class="subsection">
				<h2>Continuous Evaluations</h2>
				{#each data.continuous_evaluations as evaluation}
					<div class="card evaluation-card">
						<div class="evaluation-header">
							<h3>{evaluation.evaluation_name}</h3>
							<span class="frequency-badge">{evaluation.frequency}</span>
						</div>
						<div class="field">
							<strong>Metric:</strong> {evaluation.metric}
						</div>
						<div class="field">
							<strong>Threshold:</strong> {evaluation.threshold}
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Monitoring Dashboards -->
		{#if data.monitoring_dashboards && data.monitoring_dashboards.length > 0}
			<section class="subsection">
				<h2>Monitoring Dashboards</h2>
				{#each data.monitoring_dashboards as dashboard}
					<div class="card dashboard-card">
						<h3>{dashboard.dashboard_name}</h3>
						<div class="field">
							<strong>Metrics Tracked:</strong>
							<ul class="metrics-list">
								{#each dashboard.metrics_tracked as metric}
									<li>{metric}</li>
								{/each}
							</ul>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- SLOs (Service Level Objectives) -->
		{#if data.slos && data.slos.length > 0}
			<section class="subsection">
				<h2>Service Level Objectives (SLOs)</h2>
				<table>
					<thead>
						<tr>
							<th>SLO</th>
							<th>Target</th>
							<th>Measurement</th>
						</tr>
					</thead>
					<tbody>
						{#each data.slos as slo}
							<tr>
								<td><strong>{slo.slo_name}</strong></td>
								<td><span class="target-badge">{slo.target}</span></td>
								<td>{slo.measurement_method}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}
	{/if}
</div>

<style>
	.section-k { max-width: 1000px; }

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #6b7280;
	}
	.empty-icon { font-size: 4rem; margin-bottom: 1rem; }
	.empty-state h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #111827; }

	.subsection { margin-bottom: 2rem; }
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

	.field { margin-bottom: 1rem; }
	.field strong { color: #374151; font-weight: 600; }

	.evaluation-card { margin-bottom: 1rem; }
	.evaluation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.evaluation-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #111827;
	}

	.frequency-badge {
		background: #fef3c7;
		color: #92400e;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.dashboard-card { margin-bottom: 1rem; }
	.dashboard-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		color: #111827;
	}

	.metrics-list {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
	}
	.metrics-list li {
		margin-bottom: 0.25rem;
		color: #374151;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	thead { background: #f9fafb; }
	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	td {
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e7eb;
	}
	tr:hover { background: #f9fafb; }

	.test-type {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.tools-cell {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.target-badge {
		background: #d1fae5;
		color: #065f46;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
	}
</style>

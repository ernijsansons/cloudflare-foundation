<script lang="ts">
	import type { SectionL } from '@cloudflare/shared';
	export let data: SectionL | undefined;
</script>

<div class="section-l">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">⚡</div>
			<h3>No Operations Data</h3>
			<p>Section L will be populated during launch execution phase.</p>
		</div>
	{:else}
		<!-- Operating Cadence -->
		{#if data.operating_cadence && data.operating_cadence.length > 0}
			<section class="subsection">
				<h2>Operating Cadence</h2>
				{#each data.operating_cadence as cadence}
					<div class="card cadence-card">
						<div class="cadence-header">
							<h3>{cadence.cadence_name}</h3>
							<span class="frequency-badge">{cadence.frequency}</span>
						</div>
						<div class="field">
							<strong>Activities:</strong>
							<ul class="activities-list">
								{#each cadence.activities as activity}
									<li>{activity}</li>
								{/each}
							</ul>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Support Workflows -->
		{#if data.support_workflows && data.support_workflows.length > 0}
			<section class="subsection">
				<h2>Support Workflows</h2>
				<table>
					<thead>
						<tr>
							<th>Tier</th>
							<th>Response Time</th>
							<th>Escalation Path</th>
						</tr>
					</thead>
					<tbody>
						{#each data.support_workflows as workflow}
							<tr>
								<td><span class="tier-badge tier-{workflow.tier}">{workflow.tier}</span></td>
								<td>{workflow.response_time}</td>
								<td class="escalation-cell">{workflow.escalation_path}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		<!-- Churn Playbooks -->
		{#if data.churn_playbooks && data.churn_playbooks.length > 0}
			<section class="subsection">
				<h2>Churn Playbooks</h2>
				{#each data.churn_playbooks as playbook}
					<div class="card playbook-card">
						<h3>{playbook.trigger}</h3>
						<div class="field">
							<strong>Actions:</strong>
							<ul class="actions-list">
								{#each playbook.actions as action}
									<li>{action}</li>
								{/each}
							</ul>
						</div>
						<div class="field">
							<strong>Owner:</strong> <span class="owner-badge">{playbook.owner}</span>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Billing Operations -->
		{#if data.billing_operations && data.billing_operations.length > 0}
			<section class="subsection">
				<h2>Billing Operations</h2>
				<table>
					<thead>
						<tr>
							<th>Operation</th>
							<th>Automation Level</th>
							<th>Frequency</th>
						</tr>
					</thead>
					<tbody>
						{#each data.billing_operations as operation}
							<tr>
								<td><strong>{operation.operation_name}</strong></td>
								<td>
									<span class="automation-badge automation-{operation.automation_level.toLowerCase()}">
										{operation.automation_level}
									</span>
								</td>
								<td>{operation.frequency}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}
	{/if}
</div>

<style>
	.section-l { max-width: 1000px; }

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

	.cadence-card { margin-bottom: 1rem; }
	.cadence-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.cadence-header h3 {
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

	.activities-list {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
	}
	.activities-list li {
		margin-bottom: 0.25rem;
		color: #374151;
	}

	.playbook-card { margin-bottom: 1rem; }
	.playbook-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		color: #111827;
	}

	.actions-list {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
	}
	.actions-list li {
		margin-bottom: 0.25rem;
		color: #374151;
	}

	.owner-badge {
		background: #667eea;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
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

	.tier-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
	}
	.tier-badge.tier-1 { background: #fee2e2; color: #991b1b; }
	.tier-badge.tier-2 { background: #fef3c7; color: #92400e; }
	.tier-badge.tier-3 { background: #dbeafe; color: #1e40af; }

	.escalation-cell {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.automation-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	.automation-badge.automation-full { background: #d1fae5; color: #065f46; }
	.automation-badge.automation-partial { background: #fef3c7; color: #92400e; }
	.automation-badge.automation-manual { background: #fee2e2; color: #991b1b; }
</style>

<script lang="ts">
	import type { SectionM } from '@cloudflare/shared';
	export let data: SectionM | undefined;
</script>

<div class="section-m">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">🗺️</div>
			<h3>No Roadmap Data</h3>
			<p>Section M will be populated during synthesis phase.</p>
		</div>
	{:else}
		<!-- Roadmap Phases -->
		{#if data.roadmap_phases && data.roadmap_phases.length > 0}
			<section class="subsection">
				<h2>Roadmap Phases</h2>
				{#each data.roadmap_phases as phase}
					<div class="card phase-card">
						<div class="phase-header">
							<h3>{phase.phase_name}</h3>
							<span class="duration-badge">{phase.duration}</span>
						</div>
						<div class="field">
							<strong>Key Deliverables:</strong>
							<ul class="deliverables-list">
								{#each phase.key_deliverables as deliverable}
									<li>{deliverable}</li>
								{/each}
							</ul>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Weekly Milestones -->
		{#if data.weekly_milestones && data.weekly_milestones.length > 0}
			<section class="subsection">
				<h2>Weekly Milestones</h2>
				<table>
					<thead>
						<tr>
							<th>Week</th>
							<th>Milestone</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.weekly_milestones as milestone}
							<tr>
								<td><strong>Week {milestone.week}</strong></td>
								<td>{milestone.milestone}</td>
								<td>
									<span class="status-badge status-{milestone.status.toLowerCase().replace(' ', '-')}">
										{milestone.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		<!-- Critical Path -->
		{#if data.critical_path && data.critical_path.length > 0}
			<section class="subsection">
				<h2>Critical Path</h2>
				{#each data.critical_path as task}
					<div class="card critical-task-card">
						<div class="task-header">
							<h3>{task.task_name}</h3>
							<span class="duration-badge">{task.duration}</span>
						</div>
						<div class="field">
							<strong>Dependencies:</strong> {task.dependencies}
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Resource Allocation -->
		{#if data.resource_allocation && data.resource_allocation.length > 0}
			<section class="subsection">
				<h2>Resource Allocation</h2>
				<table>
					<thead>
						<tr>
							<th>Role</th>
							<th>Allocation</th>
							<th>Timeline</th>
						</tr>
					</thead>
					<tbody>
						{#each data.resource_allocation as resource}
							<tr>
								<td><strong>{resource.role}</strong></td>
								<td>
									<div class="allocation-bar">
										<div
											class="allocation-fill"
											style="width: {resource.allocation_percentage}%"
										>
											{resource.allocation_percentage}%
										</div>
									</div>
								</td>
								<td class="timeline-cell">{resource.timeline}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}
	{/if}
</div>

<style>
	.section-m { max-width: 1000px; }

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

	.phase-card { margin-bottom: 1rem; }
	.phase-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.phase-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #111827;
	}

	.duration-badge {
		background: #667eea;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.deliverables-list {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
	}
	.deliverables-list li {
		margin-bottom: 0.25rem;
		color: #374151;
	}

	.critical-task-card { margin-bottom: 1rem; }
	.task-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.task-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #111827;
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

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	.status-badge.status-completed { background: #d1fae5; color: #065f46; }
	.status-badge.status-in-progress { background: #fef3c7; color: #92400e; }
	.status-badge.status-pending { background: #e5e7eb; color: #374151; }
	.status-badge.status-blocked { background: #fee2e2; color: #991b1b; }

	.timeline-cell {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.allocation-bar {
		background: #e5e7eb;
		border-radius: 4px;
		height: 24px;
		position: relative;
		overflow: hidden;
	}
	.allocation-fill {
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		color: white;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		transition: width 0.3s ease;
	}
</style>

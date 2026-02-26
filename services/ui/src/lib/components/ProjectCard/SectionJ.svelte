<script lang="ts">
	import type { SectionJ } from '$lib/shared';
	export let data: SectionJ | undefined;
</script>

<div class="section-j">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">🔒</div>
			<h3>No Security Data</h3>
			<p>Section J will be populated during tech architecture phase.</p>
		</div>
	{:else}
		<!-- Threat Model -->
		{#if data.threat_model && data.threat_model.length > 0}
			<section class="subsection">
				<h2>Threat Model</h2>
				<table>
					<thead>
						<tr>
							<th>Threat</th>
							<th>Probability</th>
							<th>Impact</th>
							<th>Mitigation</th>
						</tr>
					</thead>
					<tbody>
						{#each data.threat_model as threat}
							<tr>
								<td>{threat.threat}</td>
								<td><span class="badge badge-{threat.probability}">{threat.probability}</span></td>
								<td><span class="badge badge-{threat.impact}">{threat.impact}</span></td>
								<td>{threat.mitigation}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		<!-- Security Controls -->
		{#if data.security_controls && data.security_controls.length > 0}
			<section class="subsection">
				<h2>Security Controls</h2>
				{#each data.security_controls as control}
					<div class="card control-card">
						<div class="control-header">
							<h3>{control.control_name}</h3>
							<span class="status status-{control.implementation_status}">
								{control.implementation_status}
							</span>
						</div>
						<p>{control.description}</p>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Data Handling -->
		{#if data.data_handling && data.data_handling.length > 0}
			<section class="subsection">
				<h2>Data Handling Policies</h2>
				{#each data.data_handling as policy}
					<div class="card">
						<div class="field">
							<strong>Data Type:</strong>
							{policy.data_type}
						</div>
						<div class="field">
							<strong>Retention:</strong>
							{policy.retention_period}
						</div>
						<div class="field">
							<strong>Encryption:</strong>
							{policy.encryption ? '✅ Yes' : '❌ No'}
						</div>
						<div class="field">
							<strong>Access Controls:</strong>
							{policy.access_controls}
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Compliance Posture -->
		{#if data.compliance_posture}
			<section class="subsection">
				<h2>Compliance Posture</h2>
				<div class="card">
					<p>{data.compliance_posture}</p>
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.section-j {
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

	.control-card {
	}
	.control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.control-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #111827;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.status-planned {
		background: #dbeafe;
		color: #1e40af;
	}
	.status-in-progress {
		background: #fef3c7;
		color: #92400e;
	}
	.status-implemented {
		background: #d1fae5;
		color: #065f46;
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
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	td {
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e7eb;
	}
	tr:hover {
		background: #f9fafb;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	.badge-low {
		background: #d1fae5;
		color: #065f46;
	}
	.badge-medium {
		background: #fef3c7;
		color: #92400e;
	}
	.badge-high {
		background: #fee2e2;
		color: #991b1b;
	}
	.badge-fatal {
		background: #7f1d1d;
		color: white;
	}
</style>

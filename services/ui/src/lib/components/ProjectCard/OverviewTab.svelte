<script lang="ts">
	import type { OverviewSection } from '@cloudflare/shared';

	export let overview: OverviewSection | undefined;
</script>

<div class="overview-tab">
	{#if !overview}
		<div class="empty-state">
			<div class="empty-icon">📊</div>
			<h3>No Overview Available</h3>
			<p>Documentation will be auto-generated after planning phases complete.</p>
		</div>
	{:else}
		<!-- Executive Summary -->
		<section class="overview-section">
			<h2>Executive Summary</h2>
			<div class="summary-card">
				<p class="concept">{overview.executive_summary.concept}</p>
				<div class="meta-row">
					<span class="status-badge status-{overview.executive_summary.status}">
						{overview.executive_summary.status}
					</span>
					<span class="completeness">
						{overview.executive_summary.completeness}% Complete
					</span>
				</div>
			</div>
		</section>

		<!-- Quick Stats -->
		<section class="overview-section">
			<h2>Quick Stats</h2>
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-label">Budget</div>
					<div class="stat-value">{overview.quick_stats.budget}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">Timeline</div>
					<div class="stat-value">{overview.quick_stats.timeline}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">North Star</div>
					<div class="stat-value">{overview.quick_stats.north_star_metric}</div>
				</div>
				<div class="stat-card">
					<div class="stat-label">Current Phase</div>
					<div class="stat-value">{overview.quick_stats.current_phase}</div>
				</div>
			</div>
		</section>

		<!-- Health Indicators -->
		<section class="overview-section">
			<h2>Health Indicators</h2>
			<div class="health-grid">
				<div class="health-item">
					<span class="health-icon"
						>{overview.health_indicators.documentation_complete ? '✅' : '⚠️'}</span
					>
					<span>Documentation Complete</span>
				</div>
				<div class="health-item">
					<span class="health-icon"
						>{overview.health_indicators.unknowns_resolved ? '✅' : '⚠️'}</span
					>
					<span>Unknowns Resolved</span>
				</div>
				<div class="health-item">
					<span class="health-icon">📋</span>
					<span>Checklist: {overview.health_indicators.checklist_progress}%</span>
				</div>
				<div class="health-item">
					<span class="health-icon">🔒</span>
					<span>Security: {overview.health_indicators.security_coverage}%</span>
				</div>
			</div>
		</section>

		<!-- Critical Path -->
		<section class="overview-section">
			<h2>Critical Path</h2>
			<div class="critical-path-card">
				<div class="path-item">
					<strong>Next Milestone:</strong>
					{overview.critical_path.next_milestone}
				</div>
				{#if overview.critical_path.blockers.length > 0}
					<div class="path-item blockers">
						<strong>Blockers:</strong>
						<ul>
							{#each overview.critical_path.blockers as blocker}
								<li>{blocker}</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if overview.critical_path.dependencies.length > 0}
					<div class="path-item">
						<strong>Key Dependencies:</strong>
						<ul>
							{#each overview.critical_path.dependencies as dep}
								<li>{dep}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</section>

		<!-- Quick Actions -->
		<section class="overview-section">
			<h2>Quick Actions</h2>
			<div class="actions-grid">
				{#each overview.quick_actions as action}
					<a href={action.link} class="action-button">
						{action.label}
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.overview-tab {
		max-width: 1200px;
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

	.overview-section {
		margin-bottom: 2rem;
	}

	.overview-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}

	.summary-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.concept {
		font-size: 1.125rem;
		line-height: 1.6;
		color: #374151;
		margin: 0 0 1rem 0;
	}

	.meta-row {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.status-planning {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-in-progress {
		background: #fef3c7;
		color: #92400e;
	}

	.status-completed {
		background: #d1fae5;
		color: #065f46;
	}

	.completeness {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		background: white;
		padding: 1.25rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.health-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.health-item {
		background: white;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.health-icon {
		font-size: 1.5rem;
	}

	.critical-path-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.path-item {
		margin-bottom: 1rem;
	}

	.path-item:last-child {
		margin-bottom: 0;
	}

	.path-item.blockers {
		color: #dc2626;
	}

	.path-item ul {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
	}

	.path-item li {
		margin-bottom: 0.25rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.action-button {
		display: block;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		text-align: center;
		font-weight: 500;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.action-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	/* Mobile responsive design */
	@media (max-width: 768px) {
		.overview-tab {
			max-width: 100%;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}

		.health-grid {
			grid-template-columns: 1fr;
		}

		.actions-grid {
			grid-template-columns: 1fr;
		}

		.summary-card,
		.stat-card,
		.health-item,
		.critical-path-card {
			padding: 1rem;
		}

		.concept {
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.overview-section h2 {
			font-size: 1.125rem;
		}

		.stat-value {
			font-size: 1.125rem;
		}

		.meta-row {
			flex-wrap: wrap;
		}
	}
</style>

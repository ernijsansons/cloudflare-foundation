<script lang="ts">
	import type { SectionA } from '$lib/shared';

	export let data: SectionA | undefined;
</script>

<div class="section-a">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">📝</div>
			<h3>No Assumptions Data</h3>
			<p>Section A will be populated during Phase 0 (Intake).</p>
		</div>
	{:else}
		<!-- A0: Intake Form -->
		<section class="subsection">
			<h2>A0: Idea Intake Form</h2>

			<div class="card">
				<h3>Concept</h3>
				<div class="field">
					<strong>Codename:</strong>
					{data.A0_intake.concept.codename}
				</div>
				<div class="field">
					<strong>Thesis:</strong>
					{data.A0_intake.concept.thesis}
				</div>
				<div class="field">
					<strong>Target ICP:</strong>
					{data.A0_intake.concept.target_icp}
				</div>
				<div class="field">
					<strong>Core Directive:</strong>
					{data.A0_intake.concept.core_directive}
				</div>
				<div class="field">
					<strong>Why Now:</strong>
					{data.A0_intake.concept.why_now}
				</div>
			</div>

			<div class="card">
				<h3>Outcome Unit</h3>
				<div class="field">
					<strong>Definition:</strong>
					{data.A0_intake.outcome_unit.definition}
				</div>
				<div class="field">
					<strong>Proof Artifact:</strong>
					{data.A0_intake.outcome_unit.proof_artifact}
				</div>
				<div class="field">
					<strong>Time to First Outcome:</strong>
					{data.A0_intake.outcome_unit.time_to_first_outcome}
				</div>
				<div class="field">
					<strong>Frequency:</strong>
					{data.A0_intake.outcome_unit.frequency}
				</div>
				<div class="field">
					<strong>Current Cost:</strong>
					{data.A0_intake.outcome_unit.current_cost}
				</div>
			</div>

			<div class="card">
				<h3>Agentic Execution</h3>
				<div class="field">
					<strong>Allowed Actions:</strong>
					<ul>
						{#each data.A0_intake.agentic_execution.allowed_actions as action}
							<li class="allowed">{action}</li>
						{/each}
					</ul>
				</div>
				<div class="field">
					<strong>Forbidden Actions:</strong>
					<ul>
						{#each data.A0_intake.agentic_execution.forbidden_actions as action}
							<li class="forbidden">{action}</li>
						{/each}
					</ul>
				</div>
				<div class="field">
					<strong>HITL Threshold:</strong>
					<ul>
						{#each data.A0_intake.agentic_execution.hitl_threshold as threshold}
							<li class="warning">{threshold}</li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="card">
				<h3>Constraints</h3>
				<div class="field">
					<strong>Budget Cap:</strong>
					{data.A0_intake.constraints.budget_cap}
				</div>
				<div class="field">
					<strong>Timeline:</strong>
					{data.A0_intake.constraints.timeline}
				</div>
				<div class="field">
					<strong>Geography:</strong>
					{data.A0_intake.constraints.geography}
				</div>
				<div class="field">
					<strong>Compliance Bar:</strong>
					{data.A0_intake.constraints.compliance_bar}
				</div>
				<div class="field">
					<strong>Performance Bar:</strong>
					{data.A0_intake.constraints.performance_bar}
				</div>
			</div>

			<div class="card">
				<h3>Monetization</h3>
				<div class="field">
					<strong>Who Pays:</strong>
					{data.A0_intake.monetization.who_pays}
				</div>
				<div class="field">
					<strong>Pricing Anchor:</strong>
					{data.A0_intake.monetization.pricing_anchor}
				</div>
				<div class="field">
					<strong>Sales Motion:</strong>
					{data.A0_intake.monetization.sales_motion}
				</div>
				<div class="field">
					<strong>Value Metric:</strong>
					{data.A0_intake.monetization.value_metric}
				</div>
			</div>
		</section>

		<!-- A1: Unknowns -->
		<section class="subsection">
			<h2>A1: Required Unknowns</h2>
			<div class="card unknowns-card">
				{#each Object.entries(data.A1_unknowns) as [key, value]}
					<div class="unknown-item" class:unresolved={value === 'UNKNOWN'}>
						<span class="unknown-key">{key.replace(/_/g, ' ')}:</span>
						<span class="unknown-value" class:resolved={value !== 'UNKNOWN'}>
							{value}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- A2: Global Invariants -->
		<section class="subsection">
			<h2>A2: Global Invariants</h2>
			<div class="card invariants-card">
				<div class="invariant-item">
					<span class="invariant-icon"
						>{data.A2_invariants.no_raw_destructive_ops ? '✅' : '❌'}</span
					>
					<span>No Raw Destructive Ops</span>
				</div>
				<div class="invariant-item">
					<span class="invariant-icon"
						>{data.A2_invariants.idempotent_side_effects ? '✅' : '❌'}</span
					>
					<span>Idempotent Side Effects</span>
				</div>
				<div class="invariant-item">
					<span class="invariant-icon">{data.A2_invariants.auditable_receipts ? '✅' : '❌'}</span>
					<span>Auditable Receipts</span>
				</div>
				<div class="invariant-item">
					<span class="invariant-icon">{data.A2_invariants.fail_closed ? '✅' : '❌'}</span>
					<span>Fail Closed</span>
				</div>
				<div class="invariant-item">
					<span class="invariant-label">LLM Gateway:</span>
					<span class="invariant-value">{data.A2_invariants.llm_gateway}</span>
				</div>
			</div>
		</section>
	{/if}
</div>

<style>
	.section-a {
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
		margin-bottom: 2.5rem;
	}

	.subsection h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.5rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #667eea;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 1rem 0;
	}

	.field {
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.field:last-child {
		margin-bottom: 0;
	}

	.field strong {
		color: #6b7280;
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field ul {
		margin: 0.5rem 0 0 0;
		padding: 0 0 0 1.5rem;
	}

	.field li {
		margin-bottom: 0.5rem;
	}

	li.allowed {
		color: #059669;
	}

	li.forbidden {
		color: #dc2626;
	}

	li.warning {
		color: #d97706;
	}

	.unknowns-card {
		padding: 1rem;
	}

	.unknown-item {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		margin-bottom: 0.5rem;
		border-radius: 6px;
		background: #f9fafb;
	}

	.unknown-item.unresolved {
		background: #fee2e2;
		border-left: 4px solid #dc2626;
	}

	.unknown-key {
		font-weight: 500;
		color: #374151;
		text-transform: capitalize;
	}

	.unknown-value {
		font-family: 'Courier New', monospace;
		color: #6b7280;
	}

	.unknown-value.resolved {
		color: #059669;
		font-weight: 500;
	}

	.invariants-card {
		padding: 1rem;
	}

	.invariant-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		margin-bottom: 0.5rem;
		background: #f9fafb;
		border-radius: 6px;
	}

	.invariant-icon {
		font-size: 1.25rem;
	}

	.invariant-label {
		font-weight: 500;
		color: #374151;
	}

	.invariant-value {
		color: #667eea;
		font-weight: 500;
	}

	/* Mobile responsive design */
	@media (max-width: 768px) {
		.section-a {
			max-width: 100%;
		}

		.subsection h2 {
			font-size: 1.25rem;
		}

		.card {
			padding: 1rem;
			margin-bottom: 1rem;
		}

		.card h3 {
			font-size: 1rem;
		}

		.field {
			font-size: 0.9375rem;
		}

		.unknown-item,
		.invariant-item {
			padding: 0.5rem 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.subsection h2 {
			font-size: 1.125rem;
		}

		.card {
			padding: 0.75rem;
		}

		.field strong {
			font-size: 0.8125rem;
		}

		.invariant-item {
			flex-wrap: wrap;
		}
	}
</style>

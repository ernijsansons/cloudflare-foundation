<script lang="ts">
	interface Props {
		low: number;
		mid: number;
		high: number;
		notes?: string;
	}

	let { low, mid, high, notes }: Props = $props();
</script>

<div class="cost-breakdown">
	<div class="cost-tier">
		<div class="tier-label">Bootstrap</div>
		<div class="tier-cost">${low}/mo</div>
		<div class="tier-description">Low traffic, MVP testing</div>
	</div>

	<div class="cost-tier">
		<div class="tier-label">Growth</div>
		<div class="tier-cost">${mid}/mo</div>
		<div class="tier-description">Moderate traffic, active users</div>
	</div>

	<div class="cost-tier">
		<div class="tier-label">Scale</div>
		<div class="tier-cost">${high}/mo</div>
		<div class="tier-description">High traffic, production scale</div>
	</div>

	{#if notes}
		<div class="cost-notes">
			<div class="notes-label">Notes:</div>
			<div class="notes-text">{notes}</div>
		</div>
	{/if}
</div>

<style>
	.cost-breakdown {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.cost-tier {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		transition: all var(--transition-fast);
	}

	.cost-tier:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.tier-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		margin-bottom: 0.25rem;
	}

	.tier-cost {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	.tier-description {
		font-size: 0.813rem;
		color: var(--color-text-secondary);
	}

	.cost-notes {
		margin-top: 0.5rem;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
	}

	.notes-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.notes-text {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.6;
	}
</style>

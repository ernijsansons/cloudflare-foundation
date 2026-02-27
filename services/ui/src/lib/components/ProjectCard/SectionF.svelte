<script lang="ts">
	import type { SectionF } from '$lib/shared';
	export let data: SectionF | undefined;
</script>

<div class="section-f">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">⚙️</div>
			<h3>No Backend Data</h3>
			<p>Section F will be populated during tech architecture phase.</p>
		</div>
	{:else}
		<section class="subsection">
			<h2>Backend/Middleware</h2>
			<div class="card">
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</div>
		</section>
	{/if}
</div>

<style>
	.section-f {
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
	}
	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	pre {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
	}
</style>

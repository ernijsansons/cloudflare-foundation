<script lang="ts">
	export let type: 'card' | 'table' | 'text' | 'header' | 'list' = 'card';
	export let rows = 3;
</script>

{#if type === 'card'}
	<div class="skeleton-card">
		<div class="skeleton-header"></div>
		<div class="skeleton-line"></div>
		<div class="skeleton-line"></div>
		<div class="skeleton-line short"></div>
	</div>
{:else if type === 'table'}
	<div class="skeleton-table">
		<div class="skeleton-table-header"></div>
		{#each Array(rows) as _}
			<div class="skeleton-table-row">
				<div class="skeleton-cell"></div>
				<div class="skeleton-cell"></div>
				<div class="skeleton-cell"></div>
			</div>
		{/each}
	</div>
{:else if type === 'header'}
	<div class="skeleton-header-large"></div>
	<div class="skeleton-line"></div>
{:else if type === 'list'}
	<div class="skeleton-list">
		{#each Array(rows) as _}
			<div class="skeleton-list-item">
				<div class="skeleton-bullet"></div>
				<div class="skeleton-line"></div>
			</div>
		{/each}
	</div>
{:else}
	<div class="skeleton-text">
		{#each Array(rows) as _, i}
			<div class="skeleton-line" class:short={i === rows - 1}></div>
		{/each}
	</div>
{/if}

<style>
	@keyframes shimmer {
		0% {
			background-position: -1000px 0;
		}
		100% {
			background-position: 1000px 0;
		}
	}

	.skeleton-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.skeleton-header,
	.skeleton-header-large,
	.skeleton-line,
	.skeleton-cell,
	.skeleton-bullet,
	.skeleton-table-header {
		background: linear-gradient(
			90deg,
			#f0f0f0 0%,
			#f8f8f8 50%,
			#f0f0f0 100%
		);
		background-size: 1000px 100%;
		animation: shimmer 2s infinite linear;
		border-radius: 4px;
	}

	.skeleton-header {
		height: 24px;
		width: 60%;
		margin-bottom: 1rem;
	}

	.skeleton-header-large {
		height: 32px;
		width: 50%;
		margin-bottom: 1rem;
	}

	.skeleton-line {
		height: 16px;
		width: 100%;
		margin-bottom: 0.75rem;
	}

	.skeleton-line.short {
		width: 70%;
	}

	.skeleton-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.skeleton-table-header {
		height: 40px;
		background: #f9fafb;
		margin-bottom: 1px;
	}

	.skeleton-table-row {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.skeleton-cell {
		flex: 1;
		height: 20px;
	}

	.skeleton-text {
		padding: 1rem 0;
	}

	.skeleton-list {
		padding: 1rem 0;
	}

	.skeleton-list-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.skeleton-bullet {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>

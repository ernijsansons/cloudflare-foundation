<script lang="ts">
	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		width?: string;
	}

	interface Props {
		columns: Column[];
		rows: Record<string, any>[];
		onRowClick?: (_row: Record<string, any>) => void;
		emptyMessage?: string;
	}

	let { columns, rows, onRowClick, emptyMessage = 'No data available' }: Props = $props();

	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let sortedRows = $derived(() => {
		if (!sortColumn) return rows;

		const sorted = [...rows].sort((a, b) => {
			const aVal = a[sortColumn];
			const bVal = b[sortColumn];

			// Handle null/undefined
			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			// Handle numbers
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return aVal - bVal;
			}

			// Handle strings
			const aStr = String(aVal).toLowerCase();
			const bStr = String(bVal).toLowerCase();
			return aStr.localeCompare(bStr);
		});

		return sortDirection === 'desc' ? sorted.reverse() : sorted;
	});

	function handleSort(column: Column) {
		if (!column.sortable) return;

		if (sortColumn === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column.key;
			sortDirection = 'asc';
		}
	}

	function handleRowClick(row: Record<string, any>) {
		if (onRowClick) {
			onRowClick(row);
		}
	}
</script>

<div class="data-table-container">
	<table class="data-table">
		<thead>
			<tr>
				{#each columns as column}
					<th
						style={column.width ? `width: ${column.width}` : ''}
						class:sortable={column.sortable}
						class:sorted={sortColumn === column.key}
						onclick={() => handleSort(column)}
					>
						<span class="header-content">
							{column.label}
							{#if column.sortable && sortColumn === column.key}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if sortedRows().length === 0}
				<tr class="empty-row">
					<td colspan={columns.length} class="empty-message">
						{emptyMessage}
					</td>
				</tr>
			{:else}
				{#each sortedRows() as row}
					<tr
						class="data-row"
						class:clickable={onRowClick !== undefined}
						onclick={() => handleRowClick(row)}
					>
						{#each columns as column}
							<td>{row[column.key] ?? '-'}</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.data-table-container {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg);
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		border-spacing: 0;
	}

	thead {
		position: sticky;
		top: 0;
		z-index: 1;
		background: var(--color-bg-secondary);
	}

	th {
		padding: var(--spacing-md);
		text-align: left;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
	}

	th.sortable:hover {
		background: color-mix(in srgb, var(--color-bg-secondary) 95%, var(--color-primary));
	}

	th.sorted {
		color: var(--color-primary);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-indicator {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	td {
		padding: var(--spacing-md);
		font-size: 0.875rem;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border);
	}

	.data-row {
		transition: background var(--transition-fast);
	}

	.data-row:nth-child(even) {
		background: var(--color-bg);
	}

	.data-row:nth-child(odd) {
		background: var(--color-bg-secondary);
	}

	.data-row.clickable {
		cursor: pointer;
	}

	.data-row.clickable:hover {
		background: var(--color-bg-hover);
	}

	.data-row:last-child td {
		border-bottom: none;
	}

	.empty-row {
		background: var(--color-bg);
	}

	.empty-message {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--color-text-secondary);
		font-style: italic;
	}
</style>

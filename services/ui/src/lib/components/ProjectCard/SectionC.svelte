<script lang="ts">
	import type { SectionC } from '@foundation/shared';

	export let data: SectionC | undefined;

	$: totalTasks = data ? Object.values(data).flat().length : 0;
	$: completedTasks = data
		? Object.values(data)
				.flat()
				.filter((task: any) => task.status === 'done').length
		: 0;
	$: progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
</script>

<div class="section-c">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">✅</div>
			<h3>No Checklist Data</h3>
			<p>Section C will be populated during tech architecture and launch phases.</p>
		</div>
	{:else}
		<div class="progress-header">
			<h2>Master Checklist</h2>
			<div class="progress-stats">
				<span class="progress-text">{completedTasks} / {totalTasks} tasks completed</span>
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progress}%"></div>
				</div>
				<span class="progress-percentage">{progress}%</span>
			</div>
		</div>

		{#each Object.entries(data) as [category, tasks]}
			<section class="checklist-section">
				<h3>{category.replace(/_/g, ' ')}</h3>
				<div class="tasks-list">
					{#each tasks as task}
						<div class="task-item" class:completed={task.status === 'done'}>
							<input
								type="checkbox"
								checked={task.status === 'done'}
								disabled
								class="task-checkbox"
							/>
							<div class="task-content">
								<div class="task-header">
									<span class="task-id">{task.id}</span>
									<span class="task-title">{task.task}</span>
									<span class="task-effort effort-{task.effort}">{task.effort}</span>
								</div>
								<div class="task-meta">
									<span>Owner: {task.owner}</span>
									<span>Tools: {task.tools}</span>
									{#if task.dependencies?.length > 0}
										<span>Deps: {task.dependencies.join(', ')}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style>
	.section-c {
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

	.progress-header {
		margin-bottom: 2rem;
	}

	.progress-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}

	.progress-stats {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.progress-text {
		font-size: 0.875rem;
		color: #6b7280;
		white-space: nowrap;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: #e5e7eb;
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		transition: width 0.3s ease;
	}

	.progress-percentage {
		font-size: 0.875rem;
		font-weight: 600;
		color: #667eea;
		white-space: nowrap;
	}

	.checklist-section {
		margin-bottom: 2rem;
	}

	.checklist-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 1rem 0;
		text-transform: capitalize;
	}

	.tasks-list {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.task-item {
		display: flex;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #f3f4f6;
		transition: background 0.2s ease;
	}

	.task-item:last-child {
		border-bottom: none;
	}

	.task-item:hover {
		background: #f9fafb;
	}

	.task-item.completed {
		opacity: 0.6;
	}

	.task-checkbox {
		margin-top: 0.25rem;
		flex-shrink: 0;
	}

	.task-content {
		flex: 1;
	}

	.task-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.task-id {
		font-size: 0.75rem;
		font-weight: 600;
		color: #667eea;
		background: #ede9fe;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
	}

	.task-title {
		flex: 1;
		color: #111827;
		font-weight: 500;
	}

	.task-effort {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
	}

	.effort-S {
		background: #d1fae5;
		color: #065f46;
	}

	.effort-M {
		background: #fef3c7;
		color: #92400e;
	}

	.effort-L {
		background: #fee2e2;
		color: #991b1b;
	}

	.task-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: #6b7280;
	}
</style>

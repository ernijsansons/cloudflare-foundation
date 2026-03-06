<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusColors: Record<string, string> = {
		active: 'bg-green-500',
		idle: 'bg-yellow-500',
		busy: 'bg-blue-500',
		offline: 'bg-gray-500'
	};

	const roleLabels: Record<string, string> = {
		root: 'Chief of Staff',
		manager: 'Department Manager',
		worker: 'Worker Agent'
	};

	const departmentColors: Record<string, string> = {
		engineering: 'bg-blue-500/20 text-blue-300',
		trading: 'bg-green-500/20 text-green-300',
		research: 'bg-purple-500/20 text-purple-300'
	};

	const autonomyLabels: Record<string, string> = {
		auto: 'Fully Autonomous',
		semi_auto: 'Semi-Autonomous',
		supervised: 'Supervised',
		manual_review: 'Manual Review Required'
	};
</script>

<svelte:head>
	<title>{data.agent?.name || 'Agent'} - Athena | ERLVINC Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<!-- Breadcrumb -->
	<nav class="mb-6">
		<ol class="flex items-center space-x-2 text-sm text-gray-400">
			<li><a href="/agents" class="hover:text-blue-400">Agents</a></li>
			<li><span class="mx-2">/</span></li>
			<li><span class="text-blue-400">Athena</span></li>
			<li><span class="mx-2">/</span></li>
			<li class="text-white">{data.agent?.name || 'Unknown'}</li>
		</ol>
	</nav>

	{#if data.error}
		<div class="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
			<h2 class="text-red-400 font-semibold">Error Loading Agent</h2>
			<p class="text-red-300 mt-1">{data.error}</p>
		</div>
	{:else if data.agent}
		<!-- Agent Header -->
		<div class="bg-gray-800 rounded-xl p-6 mb-6 border-l-4 border-blue-500">
			<div class="flex items-start justify-between">
				<div>
					<div class="flex items-center gap-3 mb-2">
						<h1 class="text-2xl font-bold">{data.agent.name}</h1>
						<span
							class="px-2 py-1 rounded-full text-xs font-medium {statusColors[data.agent.status]}"
						>
							{data.agent.status.toUpperCase()}
						</span>
					</div>
					<div class="flex items-center gap-4 text-sm text-gray-400">
						<span class="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
							{roleLabels[data.agent.role]}
						</span>
						{#if data.agent.department}
							<span class="px-2 py-1 rounded {departmentColors[data.agent.department] || 'bg-gray-500/20 text-gray-300'}">
								{data.agent.department.charAt(0).toUpperCase() + data.agent.department.slice(1)} Dept
							</span>
						{/if}
						<span>ID: {data.agent.id}</span>
						<span class="text-blue-400">Source: Athena</span>
					</div>
				</div>
				<div class="text-right">
					<a
						href="/agents"
						class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
					>
						Back to Agents
					</a>
				</div>
			</div>
		</div>

		<!-- Metrics Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
			<!-- Reliability Score -->
			<div class="bg-gray-800 rounded-xl p-4">
				<div class="text-sm text-gray-400 mb-1">Reliability Score</div>
				<div class="text-2xl font-bold">
					{#if data.agent.reliability_score != null}
						{data.agent.reliability_score.toFixed(1)}%
					{:else}
						<span class="text-gray-500">N/A</span>
					{/if}
				</div>
			</div>

			<!-- Hallucination Risk -->
			<div class="bg-gray-800 rounded-xl p-4">
				<div class="text-sm text-gray-400 mb-1">Hallucination Risk</div>
				<div class="text-2xl font-bold">
					{#if data.agent.hallucination_risk != null}
						<span class={data.agent.hallucination_risk > 5 ? 'text-orange-400' : 'text-green-400'}>
							{data.agent.hallucination_risk.toFixed(1)}%
						</span>
					{:else}
						<span class="text-gray-500">N/A</span>
					{/if}
				</div>
			</div>

			<!-- Autonomy Level -->
			<div class="bg-gray-800 rounded-xl p-4">
				<div class="text-sm text-gray-400 mb-1">Autonomy Level</div>
				<div class="text-lg font-semibold">
					{autonomyLabels[data.agent.autonomy_level || 'auto']}
				</div>
			</div>

			<!-- Delegation -->
			<div class="bg-gray-800 rounded-xl p-4">
				<div class="text-sm text-gray-400 mb-1">Capabilities</div>
				<div class="flex gap-2">
					{#if data.agent.can_delegate}
						<span class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">Can Delegate</span>
					{/if}
					{#if data.agent.can_execute}
						<span class="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm">Can Execute</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Performance Metrics (Athena-specific) -->
		{#if data.raw?.metrics}
			<div class="bg-gray-800 rounded-xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">Performance Metrics</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="bg-gray-700/50 rounded-lg p-4">
						<div class="text-sm text-gray-400">Tasks Completed</div>
						<div class="text-2xl font-bold text-green-400">{data.raw.metrics.tasks_completed}</div>
					</div>
					<div class="bg-gray-700/50 rounded-lg p-4">
						<div class="text-sm text-gray-400">Tasks Failed</div>
						<div class="text-2xl font-bold text-red-400">{data.raw.metrics.tasks_failed}</div>
					</div>
					<div class="bg-gray-700/50 rounded-lg p-4">
						<div class="text-sm text-gray-400">Avg Latency</div>
						<div class="text-2xl font-bold">{data.raw.metrics.avg_latency_ms}ms</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Capabilities -->
		{#if data.agent.capabilities && data.agent.capabilities.length > 0}
			<div class="bg-gray-800 rounded-xl p-6 mb-6">
				<h2 class="text-lg font-semibold mb-4">Capabilities</h2>
				<div class="flex flex-wrap gap-2">
					{#each data.agent.capabilities as capability}
						<span class="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
							{capability}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Raw Data (Debug) -->
		{#if data.raw}
			<div class="bg-gray-800 rounded-xl p-6">
				<h2 class="text-lg font-semibold mb-4">Raw Agent Data</h2>

				<!-- Tasks -->
				{#if data.raw.tasks && data.raw.tasks.length > 0}
					<div class="mb-6">
						<h3 class="text-md font-medium text-gray-300 mb-3">Recent Tasks</h3>
						<div class="space-y-2">
							{#each data.raw.tasks.slice(0, 5) as task}
								<div class="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
									<div>
										<div class="text-sm font-medium">{task.id}</div>
										{#if task.description}
											<div class="text-xs text-gray-400">{task.description}</div>
										{/if}
									</div>
									<span
										class="px-2 py-1 rounded text-xs {task.status === 'completed'
											? 'bg-green-500/20 text-green-300'
											: task.status === 'failed'
												? 'bg-red-500/20 text-red-300'
												: 'bg-yellow-500/20 text-yellow-300'}"
									>
										{task.status}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- JSON View -->
				<details class="mt-6">
					<summary class="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
						View Raw JSON
					</summary>
					<pre class="mt-2 p-4 bg-gray-900 rounded-lg text-xs overflow-x-auto text-gray-300">
{JSON.stringify(data.raw, null, 2)}
					</pre>
				</details>
			</div>
		{/if}
	{:else}
		<div class="bg-gray-800 rounded-xl p-8 text-center">
			<p class="text-gray-400">Agent not found</p>
		</div>
	{/if}
</div>

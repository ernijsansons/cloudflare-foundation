<script lang="ts">
	interface Binding {
		type: string;
		name: string;
		purpose: string;
	}

	interface Props {
		bindings: string[] | Binding[];
	}

	let { bindings }: Props = $props();

	// Icon map for different binding types
	const bindingIcons: Record<string, string> = {
		d1: '🗄️',
		'd1_databases': '🗄️',
		kv: '⚡',
		kv_namespaces: '⚡',
		r2: '📦',
		r2_buckets: '📦',
		durable_objects: '🔷',
		queues: '📬',
		vectorize: '🔍',
		ai: '🤖',
		analytics_engine_datasets: '📊',
		hyperdrive: '🚀',
		browser: '🌐',
		workflows: '⚙️'
	};

	function getBindingIcon(binding: string | Binding): string {
		const type = typeof binding === 'string' ? binding.toLowerCase() : binding.type.toLowerCase();
		return bindingIcons[type] || '📌';
	}

	function getBindingName(binding: string | Binding): string {
		if (typeof binding === 'string') return binding;
		return binding.name || binding.type;
	}

	function getBindingPurpose(binding: string | Binding): string | null {
		if (typeof binding === 'string') return null;
		return binding.purpose || null;
	}
</script>

<div class="bindings-list">
	{#each bindings as binding}
		<div class="binding-item">
			<div class="binding-icon">{getBindingIcon(binding)}</div>
			<div class="binding-content">
				<div class="binding-name">{getBindingName(binding)}</div>
				{#if getBindingPurpose(binding)}
					<div class="binding-purpose">{getBindingPurpose(binding)}</div>
				{/if}
			</div>
		</div>
	{/each}

	{#if bindings.length === 0}
		<div class="empty-state">No bindings required</div>
	{/if}
</div>

<style>
	.bindings-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.binding-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		transition: all var(--transition-fast);
	}

	.binding-item:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 3%, var(--color-bg));
	}

	.binding-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.binding-content {
		flex: 1;
		min-width: 0;
	}

	.binding-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.binding-purpose {
		font-size: 0.813rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-style: italic;
		font-size: 0.875rem;
	}
</style>

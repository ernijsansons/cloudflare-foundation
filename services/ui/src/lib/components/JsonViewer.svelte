<script lang="ts">
	interface Props {
		json: any;
		collapsible?: boolean;
	}

	let { json, collapsible: _collapsible = false }: Props = $props();

	let copySuccess = $state(false);

	let jsonString = $derived(JSON.stringify(json, null, 2));

	function copyToClipboard() {
		navigator.clipboard.writeText(jsonString).then(() => {
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		});
	}

	// Simple syntax highlighting by wrapping JSON in spans
	function _highlightJson(jsonStr: string): string {
		// This is a basic implementation. For production, consider using a library like Prism.js
		return jsonStr
			.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
				let cls = 'json-string';
				if (/:$/.test(match)) {
					cls = 'json-key';
				}
				return `<span class="${cls}">${match}</span>`;
			})
			.replace(/\b(true|false|null)\b/g, '<span class="json-boolean">$1</span>')
			.replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>');
	}
</script>

<div class="json-viewer">
	<div class="json-header">
		<h3>JSON Output</h3>
		<button class="copy-button" onclick={copyToClipboard} title="Copy JSON">
			{#if copySuccess}
				<span class="success-icon">✓</span>
				<span>Copied!</span>
			{:else}
				<span class="copy-icon">📋</span>
				<span>Copy</span>
			{/if}
		</button>
	</div>

	<div class="json-content">
		<pre class="json-pre"><code>{jsonString}</code></pre>
	</div>
</div>

<style>
	.json-viewer {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg);
		overflow: hidden;
	}

	.json-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
	}

	.json-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.copy-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.813rem;
		font-weight: 500;
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.copy-button:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
	}

	.copy-icon,
	.success-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.success-icon {
		color: var(--color-success);
	}

	.json-content {
		padding: 1.5rem;
		overflow-x: auto;
		max-height: 600px;
		overflow-y: auto;
	}

	.json-pre {
		margin: 0;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace;
		font-size: 0.813rem;
		line-height: 1.6;
		color: var(--color-text);
		white-space: pre;
		word-wrap: normal;
	}

	.json-pre code {
		display: block;
		color: var(--color-text);
	}

	/* Syntax highlighting */
	.json-pre :global(.json-key) {
		color: #0451a5;
	}

	.json-pre :global(.json-string) {
		color: #098658;
	}

	.json-pre :global(.json-number) {
		color: #098658;
	}

	.json-pre :global(.json-boolean) {
		color: #0000ff;
	}

	/* Dark theme support (if you have one) */
	@media (prefers-color-scheme: dark) {
		.json-pre :global(.json-key) {
			color: #9cdcfe;
		}

		.json-pre :global(.json-string) {
			color: #ce9178;
		}

		.json-pre :global(.json-number) {
			color: #b5cea8;
		}

		.json-pre :global(.json-boolean) {
			color: #569cd6;
		}
	}

	/* Custom scrollbar for JSON content */
	.json-content::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.json-content::-webkit-scrollbar-track {
		background: var(--color-bg-secondary);
	}

	.json-content::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-sm);
	}

	.json-content::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary);
	}
</style>

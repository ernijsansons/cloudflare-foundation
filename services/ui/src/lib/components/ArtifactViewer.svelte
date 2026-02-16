<script lang="ts">
  interface Props {
    artifact: Record<string, unknown>;
    expanded?: boolean;
  }

  let { artifact, expanded = false }: Props = $props();

  let isExpanded = $state(expanded);

  function formatValue(value: unknown, indent = 0): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return value.map((v, i) => `${i + 1}. ${formatValue(v, indent + 1)}`).join("\n");
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  function getDisplayEntries(obj: Record<string, unknown>): Array<[string, unknown]> {
    // Filter out internal fields and format for display
    return Object.entries(obj).filter(([key]) => !key.startsWith("_"));
  }

  function formatKey(key: string): string {
    return key
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
</script>

<div class="artifact-viewer">
  <button class="expand-toggle" onclick={() => (isExpanded = !isExpanded)}>
    <span class="toggle-icon">{isExpanded ? "▼" : "▶"}</span>
    <span class="toggle-label">{isExpanded ? "Collapse" : "Expand"} Artifact</span>
  </button>

  {#if isExpanded}
    <div class="artifact-content">
      {#each getDisplayEntries(artifact) as [key, value] (key)}
        <div class="artifact-field">
          <div class="field-label">{formatKey(key)}</div>
          <div class="field-value">
            {#if Array.isArray(value)}
              <ul class="value-list">
                {#each value as item, i (i)}
                  <li>
                    {#if typeof item === "object" && item !== null}
                      <pre class="value-object">{JSON.stringify(item, null, 2)}</pre>
                    {:else}
                      {String(item)}
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else if typeof value === "object" && value !== null}
              <pre class="value-object">{JSON.stringify(value, null, 2)}</pre>
            {:else}
              <span class="value-text">{formatValue(value)}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <details class="raw-json">
    <summary>View Raw JSON</summary>
    <pre>{JSON.stringify(artifact, null, 2)}</pre>
  </details>
</div>

<style>
  .artifact-viewer {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .expand-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    transition: background var(--transition-fast);
  }

  .expand-toggle:hover {
    background: var(--color-bg-tertiary);
  }

  .toggle-icon {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .artifact-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .artifact-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-value {
    font-size: 0.875rem;
    color: var(--color-text);
    line-height: 1.5;
  }

  .value-list {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .value-list li {
    color: var(--color-text);
  }

  .value-object {
    margin: 0;
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.8125rem;
    font-family: var(--font-mono, ui-monospace, monospace);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .value-text {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .raw-json {
    border-top: 1px solid var(--color-border);
  }

  .raw-json summary {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    cursor: pointer;
    user-select: none;
  }

  .raw-json summary:hover {
    color: var(--color-text);
    background: var(--color-bg-tertiary);
  }

  .raw-json pre {
    margin: 0;
    padding: 1rem;
    background: var(--color-bg);
    font-size: 0.75rem;
    font-family: var(--font-mono, ui-monospace, monospace);
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
  }
</style>

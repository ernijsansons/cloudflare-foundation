<script lang="ts">
  interface Unknown {
    id: string;
    question: string;
    importance: "critical" | "high" | "medium" | "low";
    investigationPhase?: string;
  }

  interface Props {
    unknowns: Unknown[];
  }

  let { unknowns = [] }: Props = $props();

  // Group unknowns by importance
  let groupedUnknowns = $derived(() => {
    const groups = {
      critical: [] as Unknown[],
      high: [] as Unknown[],
      medium: [] as Unknown[],
      low: [] as Unknown[],
    };

    unknowns.forEach((unknown) => {
      groups[unknown.importance].push(unknown);
    });

    return groups;
  });

  function getImportanceColor(importance: string): string {
    switch (importance) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      case "low":
        return "gray";
      default:
        return "gray";
    }
  }

  function getImportanceLabel(importance: string): string {
    return importance.charAt(0).toUpperCase() + importance.slice(1);
  }

  function getImportanceIcon(importance: string): string {
    switch (importance) {
      case "critical":
        return "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
      case "high":
        return "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      case "medium":
      case "low":
      default:
        return "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  }
</script>

<div class="unknowns-panel">
  {#if unknowns.length === 0}
    <div class="empty-state">
      <svg
        class="empty-icon"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="empty-text">No unknowns identified</p>
      <p class="empty-subtext">All questions have been answered</p>
    </div>
  {:else}
    <div class="unknowns-list">
      {#each Object.entries(groupedUnknowns()) as [importance, items]}
        {#if items.length > 0}
          <div class="importance-group">
            <div class="importance-header">
              <div class="importance-chip {getImportanceColor(importance)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d={getImportanceIcon(importance)} />
                </svg>
                <span>{getImportanceLabel(importance)}</span>
              </div>
              <span class="importance-count">{items.length}</span>
            </div>

            <ul class="items-list">
              {#each items as unknown (unknown.id)}
                <li class="unknown-item {getImportanceColor(importance)}">
                  <div class="unknown-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                  </div>

                  <div class="unknown-content">
                    <p class="unknown-question">{unknown.question}</p>

                    {#if unknown.investigationPhase}
                      <div class="investigation-phase">
                        <span class="phase-label">Investigate in:</span>
                        <button class="phase-link" type="button">
                          {unknown.investigationPhase}
                        </button>
                      </div>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .unknowns-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px dashed var(--color-border);
  }

  .empty-icon {
    color: var(--color-success, #10b981);
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-subtext {
    margin: 0.25rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  /* Unknowns List */
  .unknowns-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Importance Group */
  .importance-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .importance-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .importance-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .importance-chip.red {
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
  }

  .importance-chip.orange {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .importance-chip.yellow {
    background: color-mix(in srgb, #eab308 15%, transparent);
    color: #eab308;
  }

  .importance-chip.gray {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  .importance-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.375rem;
    background: var(--color-bg-tertiary);
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  /* Items List */
  .items-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .unknown-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
  }

  .unknown-item:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .unknown-item.red {
    border-left: 3px solid var(--color-error, #ef4444);
  }

  .unknown-item.orange {
    border-left: 3px solid var(--color-warning, #f59e0b);
  }

  .unknown-item.yellow {
    border-left: 3px solid #eab308;
  }

  .unknown-item.gray {
    border-left: 3px solid var(--color-border);
  }

  .unknown-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  .unknown-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .unknown-question {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-text);
    font-weight: 500;
  }

  .investigation-phase {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .phase-label {
    color: var(--color-text-muted);
  }

  .phase-link {
    padding: 0.125rem 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .phase-link:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary);
  }

  .phase-link:active {
    transform: scale(0.98);
  }
</style>

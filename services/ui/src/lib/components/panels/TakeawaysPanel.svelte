<script lang="ts">
  interface Takeaway {
    id: string;
    text: string;
    category: "insight" | "risk" | "opportunity" | "blocker";
    impact: "high" | "medium" | "low";
  }

  interface Props {
    takeaways: Takeaway[];
  }

  let { takeaways = [] }: Props = $props();

  // Group takeaways by category
  let groupedTakeaways = $derived(() => {
    const groups = {
      insight: [] as Takeaway[],
      opportunity: [] as Takeaway[],
      risk: [] as Takeaway[],
      blocker: [] as Takeaway[],
    };

    takeaways.forEach((takeaway) => {
      groups[takeaway.category].push(takeaway);
    });

    return groups;
  });

  function getCategoryColor(category: string): string {
    switch (category) {
      case "insight":
        return "blue";
      case "opportunity":
        return "green";
      case "risk":
        return "orange";
      case "blocker":
        return "red";
      default:
        return "gray";
    }
  }

  function getImpactColor(impact: string): string {
    switch (impact) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "gray";
      default:
        return "gray";
    }
  }

  function getCategoryLabel(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  function getImpactLabel(impact: string): string {
    return impact.charAt(0).toUpperCase() + impact.slice(1);
  }
</script>

<div class="takeaways-panel">
  {#if takeaways.length === 0}
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
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path d="M9 12h6m-6 4h6" />
      </svg>
      <p class="empty-text">No takeaways extracted yet</p>
    </div>
  {:else}
    <div class="takeaways-list">
      {#each Object.entries(groupedTakeaways()) as [category, items]}
        {#if items.length > 0}
          <div class="category-group">
            <div class="category-header">
              <span class="category-chip {getCategoryColor(category)}">
                {getCategoryLabel(category)}
              </span>
              <span class="category-count">{items.length}</span>
            </div>

            <ul class="items-list">
              {#each items as takeaway (takeaway.id)}
                <li class="takeaway-item">
                  <div class="takeaway-content">
                    <p class="takeaway-text">{takeaway.text}</p>
                    <div class="takeaway-meta">
                      <span class="impact-badge {getImpactColor(takeaway.impact)}">
                        {getImpactLabel(takeaway.impact)} impact
                      </span>
                    </div>
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
  .takeaways-panel {
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
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  /* Takeaways List */
  .takeaways-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Category Group */
  .category-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .category-chip.blue {
    background: color-mix(in srgb, #3b82f6 15%, transparent);
    color: #3b82f6;
  }

  .category-chip.green {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .category-chip.orange {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .category-chip.red {
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
  }

  .category-count {
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

  .takeaway-item {
    display: flex;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
  }

  .takeaway-item:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .takeaway-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .takeaway-text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-text);
  }

  .takeaway-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .impact-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .impact-badge.red {
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
  }

  .impact-badge.yellow {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .impact-badge.gray {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }
</style>

<script lang="ts">
  import type { DepartmentView } from "$lib/types/bible";

  interface Props {
    department?: DepartmentView;
  }

  let { department }: Props = $props();

  function renderContent(content: unknown): string {
    if (!content) return "No content available";
    if (typeof content === "object" && content !== null && "type" in content) {
      const c = content as { type: string; text?: string; items?: string[] };
      if (c.type === "markdown" && c.text) return c.text;
      if (c.type === "list" && c.items) return c.items.join("\n• ");
    }
    return JSON.stringify(content, null, 2);
  }
</script>

{#if department}
  <div class="department-content">
    <header class="dept-header">
      <h2 class="dept-title">{department.title}</h2>
      <p class="dept-summary">{department.summary}</p>
      <div class="dept-meta">
        <span class="completeness-badge">{department.completeness}% Complete</span>
        <span class="last-updated">Updated {new Date(department.lastUpdated).toLocaleString()}</span>
      </div>
    </header>

    <div class="dept-sections">
      {#each department.sections as section}
        <section class="section-card">
          <h3 class="section-title">{section.name}</h3>
          <div class="section-content">
            <pre class="content-text">{renderContent(section.content)}</pre>
          </div>
          {#if section.sources.length > 0}
            <div class="section-sources">
              <span class="sources-label">Sources:</span>
              {#each section.sources as source}
                <span class="source-tag">{source.phase}</span>
              {/each}
            </div>
          {/if}
        </section>
      {/each}
    </div>
  </div>
{:else}
  <div class="empty-state">
    <p>Select a department to view details</p>
  </div>
{/if}

<style>
  .department-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .dept-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dept-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .dept-summary {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-text-muted);
  }

  .dept-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .completeness-badge {
    padding: 0.25rem 0.75rem;
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .last-updated {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .dept-sections {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-card {
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .section-title {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .section-content {
    margin-bottom: 1rem;
  }

  .content-text {
    margin: 0;
    padding: 1rem;
    background: var(--color-bg-primary);
    border-radius: 6px;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
    font-family: inherit;
  }

  .section-sources {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }

  .sources-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .source-tag {
    padding: 0.125rem 0.5rem;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--color-text-muted);
  }
</style>

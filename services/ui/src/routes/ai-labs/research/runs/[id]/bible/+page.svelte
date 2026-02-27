<script lang="ts">
  import { page } from "$app/stores";
  import type { DepartmentId } from "$lib/types/bible";
  import DepartmentTabs from "$lib/components/bible/DepartmentTabs.svelte";
  import DepartmentContent from "$lib/components/bible/DepartmentContent.svelte";
  import AgentJSONView from "$lib/components/bible/AgentJSONView.svelte";

  const data = $derived($page.data);
  let selectedDept = $state<DepartmentId>("executive");

  let currentDepartment = $derived(
    data.departments?.find((d) => d.id === selectedDept)
  );
</script>

<div class="bible-layout">
  <header class="bible-header">
    <a href="/ai-labs/research/runs/{data.run.id}" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to Research Run
    </a>

    <div class="header-content">
      <h1 class="bible-title">{data.run.refined_idea || data.run.idea}</h1>
      <p class="bible-subtitle">Deal Master Bible</p>
    </div>
  </header>

  <div class="bible-body">
    <aside class="bible-sidebar">
      <DepartmentTabs
        departments={data.departments}
        selected={selectedDept}
        onSelect={(dept) => selectedDept = dept}
      />
    </aside>

    <main class="bible-main">
      {#if selectedDept === "agent-json"}
        <AgentJSONView payload={data.agentJSON} runId={data.run.id} />
      {:else}
        <DepartmentContent department={currentDepartment} />
      {/if}
    </main>
  </div>
</div>

<style>
  .bible-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg);
  }

  .bible-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bible-title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .bible-subtitle {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .bible-body {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
    padding: 2rem;
    flex: 1;
  }

  .bible-sidebar {
    position: sticky;
    top: 2rem;
    height: fit-content;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
  }

  .bible-main {
    min-width: 0;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .bible-body {
      grid-template-columns: 1fr;
    }

    .bible-sidebar {
      position: static;
      max-height: none;
    }
  }

  @media (max-width: 768px) {
    .bible-header {
      padding: 1rem 1.5rem;
    }

    .bible-title {
      font-size: 1.5rem;
    }

    .bible-body {
      padding: 1.5rem;
      gap: 1.5rem;
    }
  }
</style>

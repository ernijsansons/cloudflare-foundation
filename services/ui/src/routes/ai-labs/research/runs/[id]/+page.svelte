<script lang="ts">
  import { page } from "$app/stores";
  import type { PlanningRun } from "$lib/types";

  interface PageData {
    run: PlanningRun | null;
    artifacts: Record<string, unknown>;
    error: string | null;
  }

  const data = $derived($page.data as PageData);
  const artifactEntries = $derived(Object.entries(data.artifacts));
</script>

<svelte:head>
  <title>{data.run?.idea?.slice(0, 50) ?? "Run Detail"} | ERLV Inc</title>
</svelte:head>

{#if data.error}
  <div style="padding: 2rem;">
    <p style="color: red;">{data.error}</p>
    <a href="/ai-labs/research">← Back to Research</a>
  </div>
{:else if data.run}
  <div style="padding: 2rem;">
    <a href="/ai-labs/research">← Back to Research</a>
    <h1>{data.run.refined_idea || data.run.idea}</h1>
    <p><strong>ID:</strong> {data.run.id}</p>
    <p><strong>Status:</strong> {data.run.status}</p>
    <p><strong>Phase:</strong> {data.run.current_phase || "N/A"}</p>
    <p><strong>Quality Score:</strong> {data.run.quality_score || "N/A"}</p>
    <p><strong>Revenue Potential:</strong> {data.run.revenue_potential || "N/A"}</p>
    <p><strong>Mode:</strong> {data.run.mode || "N/A"}</p>
    <p><strong>Artifacts:</strong> {artifactEntries.length}</p>
    {#if artifactEntries.length > 0}
      <h2>Phase Artifacts</h2>
      {#each artifactEntries as [phase, artifact]}
        <details style="margin-bottom: 1rem;">
          <summary>{phase}</summary>
          <pre style="padding: 0.75rem; background: #f5f5f5; border-radius: 6px; overflow-x: auto;">{JSON.stringify(artifact, null, 2)}</pre>
        </details>
      {/each}
    {/if}
  </div>
{:else}
  <div style="padding: 2rem;">
    <p>Loading...</p>
  </div>
{/if}

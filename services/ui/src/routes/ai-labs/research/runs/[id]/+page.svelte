<script lang="ts">
  import { page } from "$app/stores";
  import type { PlanningRun } from "$lib/types";

  interface PageData {
    run: PlanningRun | null;
    artifacts: Record<string, unknown>;
    error: string | null;
  }

  const data = $derived($page.data as PageData);
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
  </div>
{:else}
  <div style="padding: 2rem;">
    <p>Loading...</p>
  </div>
{/if}

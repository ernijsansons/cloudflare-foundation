<script lang="ts">
  import MetricsDashboard from '$lib/components/MetricsDashboard.svelte';
  import { page } from '$app/stores';

  $: runId = $page.params.runId;
</script>

<svelte:head>
  <title>Metrics Dashboard - Run {runId}</title>
</svelte:head>

<MetricsDashboard {runId} apiBaseUrl="/api" />

<script lang="ts">
  import { page } from '$app/stores';
  import ConsensusAnalysisDashboard from '$lib/components/ConsensusAnalysisDashboard.svelte';
  import { onMount } from 'svelte';

  // Get artifactId from route params
  $: artifactId = $page.params.artifactId;

  let loading = true;
  let error: string | null = null;

  onMount(() => {
    loading = false;
  });
</script>

<svelte:head>
  <title>Consensus Analysis - {artifactId}</title>
</svelte:head>

<div class="consensus-page">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading consensus analysis...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <h2>Error Loading Consensus Data</h2>
      <p>{error}</p>
      <button onclick={() => window.location.reload()}>Retry</button>
    </div>
  {:else}
    <div class="page-header">
      <h1>K-LLM Consensus Analysis</h1>
      <p class="artifact-id">Artifact: {artifactId}</p>
    </div>

    <ConsensusAnalysisDashboard {artifactId} />
  {/if}
</div>

<style>
  .consensus-page {
    padding: 2rem;
    max-width: 1600px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 0.5rem 0;
  }

  .artifact-id {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: #666;
    margin: 0;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state p {
    color: #666;
    font-size: 1rem;
  }

  .error-state h2 {
    color: #dc2626;
    margin-bottom: 0.5rem;
  }

  .error-state p {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .error-state button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .error-state button:hover {
    background: #2563eb;
  }
</style>

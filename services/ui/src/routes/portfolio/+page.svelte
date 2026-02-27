<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Badge from "$lib/components/Badge.svelte";
  import PortfolioAnalytics from "$lib/components/PortfolioAnalytics.svelte";
  import { FilterSidebar, ActiveFilters } from "$lib/components/Filters";
  import { filtersStore, navigationStore } from "$lib/stores";
  import { getStatusColor } from "$lib/design-system";
  import type { PlanningRun } from "$lib/types";
  import { formatDate } from "$lib/utils/format-date";

  interface PageData {
    runs: PlanningRun[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Set breadcrumbs
  $effect(() => {
    navigationStore.setBreadcrumbs([{ label: "Portfolio", href: "/portfolio" }]);
  });

  // Calculate status counts for filter sidebar
  const statusCounts = $derived({
    running: data.runs.filter((r) => r.status === "running").length,
    pending: data.runs.filter((r) => r.status === "pending").length,
    completed: data.runs.filter((r) => r.status === "completed").length,
    paused: data.runs.filter((r) => r.status === "paused").length,
    killed: data.runs.filter((r) => r.status === "killed").length,
    cancelled: data.runs.filter((r) => r.status === "cancelled").length,
  });

  const modeCounts = $derived({
    local: data.runs.filter((r) => r.mode === "local").length,
    cloud: data.runs.filter((r) => r.mode === "cloud").length,
  });

  // Filter runs based on filter store
  const filteredRuns = $derived(() => {
    let runs = data.runs;
    const filters = filtersStore.filters;

    // Filter by status
    if (filters.status.length > 0) {
      runs = runs.filter((r) => filters.status.includes(r.status));
    }

    // Filter by mode
    if (filters.mode.length > 0) {
      runs = runs.filter((r) => r.mode && filters.mode.includes(r.mode));
    }

    // Filter by quality range
    if (filters.qualityRange[0] > 0 || filters.qualityRange[1] < 100) {
      runs = runs.filter((r) => {
        const score = r.quality_score ?? 0;
        return score >= filters.qualityRange[0] && score <= filters.qualityRange[1];
      });
    }

    // Filter by search
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      runs = runs.filter((r) => {
        const idea = (r.refined_idea ?? r.idea ?? "").toLowerCase();
        return idea.includes(query) || r.id.toLowerCase().includes(query);
      });
    }

    // Sort
    runs = [...runs].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (filters.sortBy) {
        case "created_at":
          aVal = a.created_at ?? 0;
          bVal = b.created_at ?? 0;
          break;
        case "updated_at":
          aVal = a.updated_at ?? a.created_at ?? 0;
          bVal = b.updated_at ?? b.created_at ?? 0;
          break;
        case "quality_score":
          aVal = a.quality_score ?? 0;
          bVal = b.quality_score ?? 0;
          break;
        case "name":
          aVal = (a.refined_idea ?? a.idea ?? "").toLowerCase();
          bVal = (b.refined_idea ?? b.idea ?? "").toLowerCase();
          break;
      }

      if (filters.sortDir === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return runs;
  });

  // Calculate summary stats from filtered runs
  const stats = $derived({
    total: filteredRuns().length,
    running: filteredRuns().filter((r) => r.status === "running").length,
    completed: filteredRuns().filter((r) => r.status === "completed").length,
    killed: filteredRuns().filter((r) => r.status === "killed").length,
  });

  // Show/hide filter sidebar
  let showFilters = $state(true);

  function handleCardClick(run: PlanningRun) {
    goto(`/ai-labs/research/runs/${run.id}`);
  }

  function toggleFilters() {
    showFilters = !showFilters;
  }
</script>

<svelte:head>
  <title>Portfolio | ERLV Inc</title>
</svelte:head>

<div class="portfolio-page">
  <header class="page-header">
    <div class="header-content">
      <h1>Portfolio</h1>
      <p class="subtitle">Overview of all research runs and their status</p>
    </div>
    <button class="filter-toggle" type="button" onclick={toggleFilters}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
      </svg>
      {showFilters ? "Hide Filters" : "Show Filters"}
    </button>
  </header>

  {#if data.error}
    <div class="error-container">
      <p class="error">{data.error}</p>
      <p class="error-hint">Make sure the planning service is running and accessible.</p>
    </div>
  {:else if data.runs.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>
      <p class="empty-title">No projects yet</p>
      <p class="empty-hint">Start by creating a new idea to begin building your portfolio.</p>
    </div>
  {:else}
    <div class="portfolio-layout" class:with-sidebar={showFilters}>
      {#if showFilters}
        <aside class="filter-sidebar-container">
          <FilterSidebar {statusCounts} {modeCounts} />
        </aside>
      {/if}

      <div class="portfolio-main">
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{stats.total}</span>
            <span class="stat-label">{filtersStore.hasActiveFilters ? "Filtered" : "Total"}</span>
          </div>
          <div class="stat">
            <span class="stat-value" style:color="var(--color-status-running)">{stats.running}</span>
            <span class="stat-label">Running</span>
          </div>
          <div class="stat">
            <span class="stat-value" style:color="var(--color-status-completed)">{stats.completed}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat">
            <span class="stat-value" style:color="var(--color-status-killed)">{stats.killed}</span>
            <span class="stat-label">Killed</span>
          </div>
        </div>

        {#if filtersStore.hasActiveFilters}
          <div class="active-filters-container">
            <ActiveFilters
              filters={filtersStore.filters}
              onRemoveStatus={(s) => filtersStore.toggleStatus(s)}
              onRemoveMode={(m) => filtersStore.toggleMode(m)}
              onResetQuality={() => filtersStore.setQualityRange([0, 100])}
              onResetDateRange={() => filtersStore.setDateRange([null, null])}
              onClearSearch={() => filtersStore.setSearch("")}
              onClearAll={() => filtersStore.resetFilters()}
            />
          </div>
        {/if}

        {#if data.runs && data.runs.length > 0}
          <PortfolioAnalytics runs={filteredRuns()} />
        {/if}

        {#if filteredRuns().length === 0}
          <div class="no-results">
            <p>No runs match your filters</p>
            <button type="button" onclick={() => filtersStore.resetFilters()}>Clear filters</button>
          </div>
        {:else}
          <div class="grid">
            {#each filteredRuns() as run (run.id)}
              <button class="card" onclick={() => handleCardClick(run)} type="button">
                <div class="card-header">
                  <div class="card-status" style:background-color={getStatusColor(run.status)}></div>
                  <Badge
                    text={run.status}
                    variant={run.status === "completed" ? "success" : run.status === "killed" ? "error" : "default"}
                  />
                </div>

                <h3 class="card-title">{run.refined_idea ?? run.idea}</h3>

                {#if run.current_phase}
                  <p class="card-phase">Phase: {run.current_phase}</p>
                {/if}

                <div class="card-meta">
                  {#if run.mode}
                    <Badge
                      text={run.mode === "local" ? "Local" : "Cloud"}
                      size="sm"
                      variant={run.mode === "local" ? "info" : "default"}
                    />
                  {/if}
                  {#if run.pivot_count && run.pivot_count > 0}
                    <Badge text={`${run.pivot_count} pivots`} size="sm" />
                  {/if}
                  {#if run.quality_score}
                    <Badge text={`${run.quality_score}%`} size="sm" variant="success" />
                  {/if}
                </div>

                <div class="card-footer">
                  <span class="card-date">{formatDate(run.created_at)}</span>
                  <span class="card-id">#{run.id.slice(0, 8)}</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .portfolio-page {
    padding: 1.5rem;
    max-width: 1600px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .header-content h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
  }

  .filter-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .filter-toggle:hover {
    background: var(--color-bg);
    color: var(--color-text);
    border-color: var(--color-text-subtle);
  }

  /* Layout with sidebar */
  .portfolio-layout {
    display: flex;
    gap: 1.5rem;
  }

  .portfolio-layout.with-sidebar {
    /* When sidebar is visible */
  }

  .filter-sidebar-container {
    flex-shrink: 0;
    width: 280px;
    position: sticky;
    top: calc(var(--topbar-height) + 1.5rem);
    height: fit-content;
    max-height: calc(100vh - var(--topbar-height) - 3rem);
    overflow-y: auto;
  }

  .portfolio-main {
    flex: 1;
    min-width: 0;
  }

  .active-filters-container {
    margin-bottom: 1rem;
  }

  .stats-bar {
    display: flex;
    gap: 2rem;
    padding: 1rem 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .portfolio-layout.with-sidebar .grid {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 1280px) {
    .portfolio-layout.with-sidebar .grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .filter-sidebar-container {
      display: none;
    }

    .portfolio-layout.with-sidebar .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .grid,
    .portfolio-layout.with-sidebar .grid {
      grid-template-columns: 1fr;
    }

    .stats-bar {
      flex-wrap: wrap;
      gap: 1rem 2rem;
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-toggle {
      align-self: flex-start;
    }
  }

  .card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    text-align: left;
    cursor: pointer;
    transition:
      box-shadow var(--transition-fast),
      border-color var(--transition-fast);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .card:hover {
    border-color: var(--color-border-focus);
    box-shadow: var(--shadow-sm);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .card-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .card-title {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-phase {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .card-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    gap: 1rem;
  }

  .no-results p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .no-results button {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .no-results button:hover {
    background: var(--color-primary-hover);
  }

  .error-container {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--color-error);
    font-size: 0.875rem;
  }

  .error-hint {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    border-radius: 8px;
  }

  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  .empty-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .empty-hint {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    max-width: 400px;
  }
</style>

<script lang="ts">
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>Dashboard | AI Labs</title>
</svelte:head>

<div class="dashboard">
  <header class="page-header">
    <h1>Dashboard</h1>
    <p class="subtitle">Welcome to AI Labs - your idea validation platform</p>
  </header>

  <div class="quick-links">
    <a href="/ai-labs/research" class="quick-link">
      <div class="quick-link-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 3h6v7l4 9H5l4-9V3z" />
          <path d="M9 3h6" />
        </svg>
      </div>
      <div class="quick-link-content">
        <h3>Research Runs</h3>
        <p>View and manage validation pipelines</p>
      </div>
    </a>

    <a href="/ai-labs/idea" class="quick-link">
      <div class="quick-link-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div class="quick-link-content">
        <h3>Ideas</h3>
        <p>Browse parked and new ideas</p>
      </div>
    </a>

    <a href="/agents" class="quick-link">
      <div class="quick-link-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <circle cx="9" cy="14" r="2" />
          <circle cx="15" cy="14" r="2" />
          <path d="M12 2v4" />
          <circle cx="12" cy="2" r="1" />
        </svg>
      </div>
      <div class="quick-link-content">
        <h3>Agents</h3>
        <p>Chat with AI agents</p>
      </div>
    </a>
  </div>

  <div class="info-card">
    <h3>Getting Started</h3>
    <p>Click "Create" in the top bar to start a new research run, or navigate to AI Labs to view existing runs and ideas.</p>
    <p class="tenant-info">Tenant: {$page.data.tenantId ?? "default"}</p>
  </div>
</div>

<style>
  .dashboard {
    padding: 1.5rem;
    max-width: 1200px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
  }

  .quick-links {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .quick-link {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    text-decoration: none;
    color: var(--color-text);
    transition: all var(--transition-fast);
  }

  .quick-link:hover {
    border-color: var(--color-border-focus);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
  }

  .quick-link-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border-radius: 8px;
  }

  .quick-link-content h3 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .quick-link-content p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .info-card {
    padding: 1.25rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .info-card h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  .info-card p {
    margin: 0 0 0.5rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .tenant-info {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-subtle);
  }
</style>

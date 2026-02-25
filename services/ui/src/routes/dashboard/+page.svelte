<script lang="ts">
  import { page } from "$app/stores";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
</script>

<svelte:head>
  <title>Dashboard | AI Labs</title>
</svelte:head>

<div class="dashboard" in:fade={{ duration: 300, easing: cubicOut }}>
  <header class="page-header" in:fly={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}>
    <div class="header-content">
      <h1>Dashboard</h1>
      <p class="subtitle">Welcome to AI Labs — your autonomous validation platform.</p>
    </div>
    <div class="header-actions">
      <div class="tenant-badge">
        <span class="pulse"></span>
        Tenant: <strong>{$page.data.tenantId ?? "default"}</strong>
      </div>
    </div>
  </header>

  <div class="grid-layout">
    <!-- Main Quick Links Grid -->
    <div class="quick-links" in:fly={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}>
      <a href="/ai-labs/research" class="bento-card primary-card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 3h6v7l4 9H5l4-9V3z" />
            <path d="M9 3h6" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Research Runs</h3>
          <p>Deploy and monitor autonomous validation pipelines for new ideas.</p>
        </div>
        <div class="card-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </a>

      <a href="/ai-labs/idea" class="bento-card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Raw Ideas</h3>
          <p>Browse the backlog of parked and conceptual ideas.</p>
        </div>
      </a>

      <a href="/agents" class="bento-card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <circle cx="9" cy="14" r="2" />
            <circle cx="15" cy="14" r="2" />
            <path d="M12 2v4" />
            <circle cx="12" cy="2" r="1" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Agent Swarm</h3>
          <p>Monitor hierarchy and execution state of active agents.</p>
        </div>
      </a>

      <a href="/tasks" class="bento-card">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Task Roadmaps</h3>
          <p>View active execution roadmaps and generated schemas.</p>
        </div>
      </a>
    </div>

    <!-- Info Sidebar -->
    <div class="info-sidebar" in:fly={{ y: 20, duration: 400, delay: 300, easing: cubicOut }}>
      <div class="info-card">
        <div class="info-header">
          <div class="info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <h3>Getting Started</h3>
        </div>
        <div class="info-body">
          <p>To initiate a new workflow, click <strong>Create</strong> in the top navigation bar. You can either log a raw idea or deploy a full autonomous research run.</p>
          <div class="system-status">
            <div class="status-item">
              <span class="status-label">Foundation v2.5</span>
              <span class="status-value success">Active</span>
            </div>
            <div class="status-item">
              <span class="status-label">Agent Engine</span>
              <span class="status-value success">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
  }

  .header-content h1 {
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 1rem;
    margin: 0;
  }

  .tenant-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.875rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: 0.8125rem;
    color: var(--color-text-subtle);
    font-family: var(--font-mono);
  }

  .tenant-badge strong {
    color: var(--color-text);
    font-weight: 600;
  }

  .pulse {
    width: 6px;
    height: 6px;
    background-color: var(--color-success);
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  .grid-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 2rem;
    align-items: start;
  }

  .quick-links {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .bento-card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    text-decoration: none;
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .bento-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--radius-lg);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 0%, transparent);
    transition: all var(--transition-normal);
    pointer-events: none;
  }

  .bento-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: var(--color-bg-secondary);
  }

  .bento-card:hover::after {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }

  .primary-card {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    background: linear-gradient(145deg, var(--color-bg), var(--color-bg-secondary));
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  }

  .primary-card .card-content {
    flex: 1;
  }

  .card-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-text-subtle);
    transition: all var(--transition-fast);
  }

  .primary-card:hover .card-action {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateX(4px);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-primary);
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-normal);
  }

  .primary-card .card-icon {
    margin-bottom: 0;
    width: 64px;
    height: 64px;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    border-color: transparent;
    box-shadow: none;
  }

  .primary-card .card-icon svg {
    width: 32px;
    height: 32px;
  }

  .bento-card:hover .card-icon {
    transform: scale(1.05);
  }

  .card-content h3 {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .card-content p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .info-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .info-card {
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .info-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }

  .info-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .info-body p {
    margin: 0 0 1.25rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .system-status {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1.25rem;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
  }

  .status-label {
    color: var(--color-text-subtle);
    font-family: var(--font-mono);
  }

  .status-value {
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-full);
  }

  .status-value.success {
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: var(--color-success);
  }

  @media (max-width: 900px) {
    .grid-layout {
      grid-template-columns: 1fr;
    }
    
    .primary-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .card-action {
      display: none;
    }
  }
</style>
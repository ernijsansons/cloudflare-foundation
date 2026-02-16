<script lang="ts">
</script>

<svelte:head>
  <title>Agents | AI Labs</title>
</svelte:head>

<div class="agents-page">
  <header class="page-header">
    <h1>Agents</h1>
    <p class="subtitle">Chat with AI agents for research and planning</p>
  </header>

  <div class="agents-grid">
    <a href="/chat" class="agent-card">
      <div class="agent-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div class="agent-info">
        <h3>Chat Agent</h3>
        <p>General purpose conversational agent for research and planning assistance.</p>
      </div>
    </a>
  </div>
</div>

<style>
  .agents-page {
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

  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .agent-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    text-decoration: none;
    color: var(--color-text);
    transition: all var(--transition-fast);
  }

  .agent-card:hover {
    border-color: var(--color-border-focus);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
  }

  .agent-icon {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    border-radius: 12px;
  }

  .agent-info h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .agent-info p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }
</style>

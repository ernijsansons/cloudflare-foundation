<script lang="ts">
  interface Props {
    onCreateClick?: () => void;
  }

  let { onCreateClick }: Props = $props();
</script>

<header class="topbar">
  <div class="topbar-left">
    <a href="/dashboard" class="logo">
      <!-- ERLV Inc Monogram - Geometric institutional mark -->
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <!-- E vertical bar -->
        <rect x="4" y="4" width="4" height="24" fill="#0B0B0C"/>
        <!-- E horizontal bars -->
        <rect x="4" y="4" width="14" height="3" fill="#0B0B0C"/>
        <rect x="4" y="14.5" width="11" height="3" fill="#0B0B0C"/>
        <rect x="4" y="25" width="14" height="3" fill="#0B0B0C"/>
        <!-- V diagonal accent (right side) -->
        <polygon points="20,4 24,4 28,28 24,28 22,16" fill="#0B0B0C"/>
      </svg>
      <span class="logo-text">ERLV Inc</span>
    </a>
  </div>

  <div class="topbar-center">
    <div class="search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="text" placeholder="Search..." class="search-input" />
      <kbd class="search-kbd">Ctrl+K</kbd>
    </div>
  </div>

  <div class="topbar-right">
    <button class="create-btn" onclick={onCreateClick} type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Create
    </button>

    <button class="user-btn" type="button" aria-label="User menu">
      <div class="avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </button>
  </div>
</header>

<style>
  .topbar {
    height: var(--topbar-height);
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 30;
  }

  .topbar-left {
    flex: 0 0 auto;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text);
    text-decoration: none;
  }

  .logo:hover {
    text-decoration: none;
  }

  .logo-text {
    font-weight: 600;
    font-size: 1.125rem;
  }

  .topbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
    max-width: 480px;
    margin: 0 1rem;
  }

  .search {
    position: relative;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }

  .search-kbd {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
    font-family: var(--font-sans);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-muted);
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background var(--transition-fast);
  }

  .create-btn:hover {
    background: var(--color-primary-hover);
  }

  .user-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    transition: border-color var(--transition-fast);
  }

  .user-btn:hover {
    border-color: var(--color-border-focus);
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }
</style>

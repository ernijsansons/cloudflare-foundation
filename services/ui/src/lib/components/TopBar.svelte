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
    background: color-mix(in srgb, var(--color-bg) 80%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
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
    gap: 0.625rem;
    color: var(--color-text);
    text-decoration: none;
    transition: opacity var(--transition-fast);
  }

  .logo:hover {
    opacity: 0.8;
  }

  .logo-text {
    font-weight: 600;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
  }

  .topbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
    max-width: 540px;
    margin: 0 1rem;
  }

  .search {
    position: relative;
    width: 100%;
    transition: transform var(--transition-bounce);
  }

  .search:focus-within {
    transform: translateY(-1px);
  }

  .search-icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-subtle);
    pointer-events: none;
    transition: color var(--transition-fast);
  }

  .search:focus-within .search-icon {
    color: var(--color-primary);
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.875rem 0.5rem 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-secondary);
    font-size: 0.875rem;
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .search-input:hover {
    background: var(--color-bg);
    border-color: color-mix(in srgb, var(--color-border) 80%, var(--color-text-muted));
  }

  .search-input:focus {
    outline: none;
    background: var(--color-bg);
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  .search-kbd {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.25rem 0.4rem;
    font-size: 0.7rem;
    font-weight: 500;
    font-family: var(--font-mono);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    box-shadow: var(--shadow-sm);
    pointer-events: none;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.45rem 0.875rem;
    background: var(--color-primary);
    color: #ffffff;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: var(--shadow-sm), inset 0 1px 0 hsla(0, 0%, 100%, 0.2);
    transition: all var(--transition-fast);
  }

  .create-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md), inset 0 1px 0 hsla(0, 0%, 100%, 0.2);
  }

  .create-btn:active {
    transform: translateY(0);
    box-shadow: none;
  }

  .user-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
    transition: all var(--transition-fast);
  }

  .user-btn:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text);
    background: var(--color-bg);
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

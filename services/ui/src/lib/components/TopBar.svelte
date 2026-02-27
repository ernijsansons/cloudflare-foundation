<script lang="ts">
  import { searchStore, mobileNavStore } from '$lib/stores';
  import { browser } from '$app/environment';

  interface Props {
    onCreateClick?: () => void;
  }

  let { onCreateClick }: Props = $props();

  // Detect platform for keyboard shortcut display
  const isMac = browser && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  // Handle global keyboard shortcut
  function handleKeyDown(event: KeyboardEvent) {
    // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      searchStore.open();
    }
  }

  // Open search modal on click
  function openSearch() {
    searchStore.open();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<header class="topbar">
  <div class="topbar-left">
    <!-- Mobile hamburger menu button -->
    <button
      class="mobile-menu-btn"
      type="button"
      onclick={() => mobileNavStore.toggle()}
      aria-label={mobileNavStore.isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileNavStore.isOpen}
    >
      {#if mobileNavStore.isOpen}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      {:else}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      {/if}
    </button>

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
    <button class="search" type="button" onclick={openSearch} aria-label="Open search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span class="search-placeholder">Search...</span>
      <kbd class="search-kbd">{shortcutKey}</kbd>
    </button>
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
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0.875rem 0.5rem 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-secondary);
    font-size: 0.875rem;
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .search:hover {
    background: var(--color-bg);
    border-color: color-mix(in srgb, var(--color-border) 80%, var(--color-text-muted));
    transform: translateY(-1px);
  }

  .search:focus-visible {
    outline: none;
    background: var(--color-bg);
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
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

  .search:hover .search-icon,
  .search:focus-visible .search-icon {
    color: var(--color-primary);
  }

  .search-placeholder {
    flex: 1;
    text-align: left;
    color: var(--color-text-muted);
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

  /* Mobile hamburger button */
  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-right: 0.5rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .mobile-menu-btn:hover {
    background: var(--color-bg-secondary);
  }

  /* Mobile styles */
  @media (max-width: 767px) {
    .topbar {
      padding: 0 0.75rem;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .logo-text {
      display: none;
    }

    .topbar-center {
      flex: 0 0 auto;
      margin: 0 0.5rem;
    }

    .search {
      width: 40px;
      height: 40px;
      padding: 0;
      justify-content: center;
      border-radius: var(--radius-full);
    }

    .search-icon {
      position: static;
      transform: none;
    }

    .search-placeholder,
    .search-kbd {
      display: none;
    }

    .topbar-right {
      gap: 0.5rem;
    }

    .create-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      justify-content: center;
      font-size: 0;
      border-radius: var(--radius-full);
    }
  }

  /* Small mobile */
  @media (max-width: 480px) {
    .topbar-center {
      display: none;
    }
  }
</style>

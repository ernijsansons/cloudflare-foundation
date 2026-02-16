<script lang="ts">
  import { page } from "$app/stores";

  interface Tab {
    href: string;
    label: string;
    count?: number;
  }

  interface Props {
    tabs: Tab[];
  }

  let { tabs }: Props = $props();
</script>

<nav class="subnav">
  {#each tabs as tab (tab.href)}
    <a
      href={tab.href}
      class="subnav-tab"
      class:active={$page.url.pathname === tab.href}
    >
      {tab.label}
      {#if tab.count !== undefined}
        <span class="count">{tab.count}</span>
      {/if}
    </a>
  {/each}
</nav>

<style>
  .subnav {
    display: flex;
    gap: 0.25rem;
    padding: 0 1rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .subnav-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .subnav-tab:hover {
    color: var(--color-text);
    text-decoration: none;
  }

  .subnav-tab.active {
    color: var(--color-primary);
  }

  .subnav-tab.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
  }

  .count {
    font-size: 0.75rem;
    padding: 0.0625rem 0.375rem;
    background: var(--color-bg-tertiary);
    border-radius: 9999px;
    color: var(--color-text-muted);
  }

  .active .count {
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
  }
</style>

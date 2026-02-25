<script lang="ts">
  import { page } from "$app/stores";

  interface Props {
    collapsed?: boolean;
  }

  let { collapsed = false }: Props = $props();

  interface NavItem {
    href: string;
    label: string;
    icon: string;
    children?: { href: string; label: string }[];
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", icon: "home", label: "Dashboard" },
    {
      href: "/ai-labs",
      icon: "beaker",
      label: "AI Labs",
      children: [
        { href: "/ai-labs/idea", label: "Ideas" },
        { href: "/ai-labs/research", label: "Research" },
        { href: "/ai-labs/production", label: "Production" },
        { href: "/ai-labs/parked-ideas", label: "Parked Ideas" },
      ],
    },
    { href: "/agents", icon: "robot", label: "Agents" },
    { href: "/portfolio", icon: "briefcase", label: "Portfolio" },
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/";
    }
    return currentPath.startsWith(href);
  }
</script>

<aside class="sidebar" class:collapsed>
  <nav class="nav">
    {#each navItems as item (item.href)}
      <a
        href={item.href}
        class="nav-item"
        class:active={isActive(item.href, $page.url.pathname)}
      >
        <span class="nav-icon">
          {#if item.icon === "home"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          {:else if item.icon === "beaker"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 3h6v7l4 9H5l4-9V3z" />
              <path d="M9 3h6" />
            </svg>
          {:else if item.icon === "robot"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <circle cx="9" cy="14" r="2" />
              <circle cx="15" cy="14" r="2" />
              <path d="M12 2v4" />
              <circle cx="12" cy="2" r="1" />
            </svg>
          {:else if item.icon === "briefcase"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          {/if}
        </span>
        {#if !collapsed}
          <span class="nav-label">{item.label}</span>
        {/if}
      </a>

      {#if item.children && !collapsed && isActive(item.href, $page.url.pathname)}
        <div class="nav-children">
          {#each item.children as child (child.href)}
            <a
              href={child.href}
              class="nav-child"
              class:active={$page.url.pathname === child.href}
            >
              {child.label}
            </a>
          {/each}
        </div>
      {/if}
    {/each}
  </nav>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    height: calc(100vh - var(--topbar-height));
    overflow-y: auto;
    transition: width var(--transition-normal);
    display: flex;
    flex-direction: column;
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed);
  }

  .nav {
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    color: var(--color-text-subtle);
    text-decoration: none;
    transition: all var(--transition-fast);
    position: relative;
  }

  .nav-item:hover {
    background: color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent);
    color: var(--color-text);
  }

  .nav-item.active {
    background: var(--color-bg);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm), inset 0 0 0 1px var(--color-border);
  }

  /* Subtle indicator line for active items */
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: -0.75rem;
    top: 50%;
    transform: translateY(-50%);
    height: 1.25rem;
    width: 3px;
    background: var(--color-primary);
    border-radius: 0 4px 4px 0;
  }

  .nav-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-fast);
  }

  .nav-item.active .nav-icon {
    transform: scale(1.05);
  }

  .nav-label {
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .nav-children {
    margin-left: 2.25rem;
    margin-top: 0.125rem;
    margin-bottom: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    position: relative;
  }

  /* Subtle connecting line for child items */
  .nav-children::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 0.25rem;
    bottom: 0.25rem;
    width: 1px;
    background: var(--color-border);
  }

  .nav-child {
    display: block;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    text-decoration: none;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .nav-child:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent);
  }

  .nav-child.active {
    color: var(--color-primary);
    font-weight: 500;
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
</style>

<script lang="ts">
  import TopBar from "./TopBar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import CreateModal from "./CreateModal.svelte";
  import { SearchModal } from "./Search";
  import Breadcrumb from "./Breadcrumb.svelte";
  import { navigationStore, mobileNavStore } from "$lib/stores";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let createModalOpen = $state(false);

  // Close mobile nav when clicking on main content
  function handleMainClick() {
    if (mobileNavStore.isOpen && mobileNavStore.isMobile) {
      mobileNavStore.close();
    }
  }

  function handleCreateClick() {
    createModalOpen = true;
  }

  function handleCreateClose() {
    createModalOpen = false;
  }

  async function handleCreateSubmit(data: { type: "idea" | "run"; idea: string; mode?: "local" | "cloud" }) {
    const res = await fetch("/api/public/planning/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: data.idea, mode: data.mode ?? "cloud" }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to create");
    }

    // Refresh page to show new run
    window.location.reload();
  }
</script>

<div class="app-shell">
  <TopBar onCreateClick={handleCreateClick} />

  <div class="app-body">
    <!-- Mobile overlay backdrop -->
    {#if mobileNavStore.isOpen && mobileNavStore.isMobile}
      <button
        class="mobile-backdrop"
        onclick={() => mobileNavStore.close()}
        aria-label="Close navigation"
      ></button>
    {/if}

    <Sidebar />

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <main class="app-main" onclick={handleMainClick}>
      {#if navigationStore.hasBreadcrumbs}
        <div class="breadcrumb-container">
          <Breadcrumb />
        </div>
      {/if}
      {@render children()}
    </main>
  </div>
</div>

<CreateModal
  open={createModalOpen}
  onClose={handleCreateClose}
  onSubmit={handleCreateSubmit}
/>

<!-- Global Search Modal (Cmd+K) -->
<SearchModal />

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-body {
    display: flex;
    flex: 1;
    position: relative;
  }

  .app-main {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg);
  }

  .breadcrumb-container {
    padding: 0 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .mobile-backdrop {
    display: none;
  }

  /* Mobile styles */
  @media (max-width: 767px) {
    .mobile-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      top: var(--topbar-height);
      background: rgba(0, 0, 0, 0.5);
      z-index: 40;
      border: none;
      cursor: pointer;
      animation: fadeIn 200ms ease-out;
    }

    .app-main {
      width: 100%;
    }

    .breadcrumb-container {
      padding: 0 1rem;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>

<script lang="ts">
  import TopBar from "./TopBar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import CreateModal from "./CreateModal.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let createModalOpen = $state(false);

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
    <Sidebar />
    <main class="app-main">
      {@render children()}
    </main>
  </div>
</div>

<CreateModal
  open={createModalOpen}
  onClose={handleCreateClose}
  onSubmit={handleCreateSubmit}
/>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-body {
    display: flex;
    flex: 1;
  }

  .app-main {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg);
  }
</style>

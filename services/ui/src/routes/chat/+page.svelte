<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";

  let messages: Array<{ role: string; content: string; id: string }> = [];
  let input = "";
  let ws: WebSocket | null = null;
  const agentName = `chat:${$page.data.tenantId ?? "default"}:${$page.data.userId ?? "anon"}`;

  onMount(() => {
    const protocol = typeof location !== "undefined" && location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof location !== "undefined" ? location.host : "";
    ws = new WebSocket(`${protocol}//${host}/api/agents/chat-agent/${agentName}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "state_update" && data.state?.messages) {
          messages = data.state.messages.map((m: { role: string; content: string }) => ({
            ...m,
            id: crypto.randomUUID(),
          }));
        }
      } catch {}
    };
  });
  onDestroy(() => ws?.close());

  function send() {
    if (!input.trim() || !ws) return;
    ws.send(JSON.stringify({ type: "chat_message", content: input }));
    input = "";
  }
</script>

<h1>Chat</h1>
<div>
  {#each messages as msg (msg.id)}
    <p><strong>{msg.role}:</strong> {msg.content}</p>
  {/each}
</div>
<form onsubmit={(e) => { e.preventDefault(); send(); }}>
  <input bind:value={input} placeholder="Message..." />
  <button type="submit">Send</button>
</form>

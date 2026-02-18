<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";

  type Message = { role: string; content: string; id: string };

  let messages: Message[] = [];
  let input = "";
  let thinking = false;
  let ws: WebSocket | null = null;
  const agentName = `chat:${$page.data.tenantId ?? "default"}:${$page.data.userId ?? "anon"}`;

  onMount(() => {
    const protocol = typeof location !== "undefined" && location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof location !== "undefined" ? location.host : "";
    ws = new WebSocket(`${protocol}//${host}/api/agents/chat-agent/${agentName}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Agents SDK sends cf_agent_state_update; legacy state_update also supported
        if (
          (data.type === "cf_agent_state_update" || data.type === "state_update") &&
          data.state?.messages
        ) {
          messages = (data.state.messages as Array<{ role: string; content: string }>).map((m) => ({
            ...m,
            id: crypto.randomUUID(),
          }));
          thinking = false;
        }
      } catch {}
    };
    ws.onclose = () => { thinking = false; };
  });
  onDestroy(() => ws?.close());

  function send() {
    if (!input.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    thinking = true;
    ws.send(JSON.stringify({ type: "chat", content: input }));
    input = "";
  }
</script>

<h1>Chat</h1>
<div style="max-height: 60vh; overflow-y: auto; padding: 1rem 0;">
  {#each messages as msg (msg.id)}
    <p style="margin: 0.5rem 0; text-align: {msg.role === 'user' ? 'right' : 'left'}">
      <span
        style="display: inline-block; padding: 0.4rem 0.8rem; border-radius: 8px;
               background: {msg.role === 'user' ? '#0070f3' : '#f0f0f0'};
               color: {msg.role === 'user' ? '#fff' : '#000'}; max-width: 75%;"
      >{msg.content}</span>
    </p>
  {/each}
  {#if thinking}
    <p style="margin: 0.5rem 0; text-align: left; color: #888; font-style: italic;">Thinking…</p>
  {/if}
</div>
<form onsubmit={(e) => { e.preventDefault(); send(); }} style="display: flex; gap: 0.5rem;">
  <input
    bind:value={input}
    placeholder="Message…"
    disabled={thinking}
    style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
  />
  <button type="submit" disabled={thinking || !input.trim()} style="padding: 0.5rem 1rem;">Send</button>
</form>

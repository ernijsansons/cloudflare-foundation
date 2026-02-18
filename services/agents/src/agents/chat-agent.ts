import { Agent } from "agents";
import type { Connection, WSMessage } from "agents";

export interface Env {
  CHAT_AGENT: DurableObjectNamespace;
  DB: D1Database;
  AI: Ai;
}

export type State = { messages: Array<{ role: string; content: string }> };

export class ChatAgent extends Agent<Env, State> {
  initialState: State = { messages: [] };

  async onStart(): Promise<void> {
    // Optional setup
  }

  async onMessage(connection: Connection, message: WSMessage): Promise<void> {
    let data: { type: string; content: string };
    try {
      data = JSON.parse(message as string) as { type: string; content: string };
    } catch {
      return;
    }
    if (data.type !== "chat" || !data.content?.trim()) return;

    // Append user message and broadcast immediately so UI shows it
    const userMsg = { role: "user", content: data.content.trim() };
    await this.setState({ messages: [...this.state.messages, userMsg] });

    // Call Workers AI with built-in retry (exponential backoff, up to 3 attempts)
    let assistantContent = "";
    try {
      const response = await this.retry(
        () =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
            messages: this.state.messages as RoleScopedChatInput[],
          }),
        { maxAttempts: 3 }
      );
      assistantContent =
        (response as { response?: string }).response ??
        "I couldn't generate a response. Please try again.";
    } catch {
      assistantContent = "AI inference failed after 3 retries.";
    }

    const assistantMsg = { role: "assistant", content: assistantContent };
    await this.setState({ messages: [...this.state.messages, assistantMsg] });
  }

  validateStateChange(state: State): void {
    // Cap at 100 messages to control DO SQLite storage billing
    if (state.messages.length > 100) {
      state.messages = state.messages.slice(-100);
    }
  }

  async onRequest(request: Request): Promise<Response> {
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

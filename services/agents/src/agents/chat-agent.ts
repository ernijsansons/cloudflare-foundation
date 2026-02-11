import { Agent } from "agents";

export interface Env {
  CHAT_AGENT: DurableObjectNamespace;
  DB: D1Database;
  AI: Ai;
}

export type State = { messages: Array<{ role: string; content: string }> };

export class ChatAgent extends Agent<Env, State> {
  initialState: State = { messages: [] };

  async onStart(): Promise<void> {
    // Optional
  }

  async onRequest(request: Request): Promise<Response> {
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

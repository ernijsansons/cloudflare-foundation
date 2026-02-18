import { Agent } from "agents";

export interface Env {
  SESSION_AGENT: DurableObjectNamespace;
  DB: D1Database;
}

export type State = { sessionId: string; userId: string };

export class SessionAgent extends Agent<Env, State> {
  initialState: State = { sessionId: "", userId: "" };

  async onStart(): Promise<void> {}
  async onRequest(request: Request): Promise<Response> {
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

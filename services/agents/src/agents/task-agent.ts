import { Agent } from "agents";

export interface Env {
  TASK_AGENT: DurableObjectNamespace;
  DB: D1Database;
}

export type State = { tasks: string[] };

export class TaskAgent extends Agent<Env, State> {
  initialState: State = { tasks: [] };

  async onStart(): Promise<void> {}
  async onRequest(request: Request): Promise<Response> {
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

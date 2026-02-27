import { Agent } from "agents";

export interface Env {
  TENANT_AGENT: DurableObjectNamespace;
  DB: D1Database;
}

export type State = { tenantId: string; plan: string };

export class TenantAgent extends Agent<Env, State> {
  initialState: State = { tenantId: "", plan: "free" };

  validateStateChange(state: State): void {
    if (state.tenantId === "") {
      throw new Error("tenantId cannot be empty");
    }
  }

  async onStart(): Promise<void> {}

  async onRequest(request: Request): Promise<Response> {
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

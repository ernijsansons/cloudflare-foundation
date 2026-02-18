import { Agent } from "agents";

export interface Env {
  TASK_AGENT: DurableObjectNamespace;
  DB: D1Database;
}

export type Task = { id: string; content: string; status: "pending" | "done" };
export type State = { tasks: Task[] };

export class TaskAgent extends Agent<Env, State> {
  initialState: State = { tasks: [] };

  async onStart(): Promise<void> {
    // Register a recurring queue processor — runs every 30s with overlap prevention
    await this.scheduleEvery(30, "processQueue");
  }

  async processQueue(): Promise<void> {
    const pending = this.state.tasks.filter((t) => t.status === "pending");
    if (pending.length === 0) return;
    const updated = this.state.tasks.map((t) =>
      t.status === "pending" ? { ...t, status: "done" as const } : t
    );
    await this.setState({ tasks: updated });
    console.log(`TaskAgent: processed ${pending.length} pending task(s)`);
  }

  async onRequest(request: Request): Promise<Response> {
    if (request.method === "POST") {
      const body = (await request.json()) as { content: string };
      if (body.content?.trim()) {
        const newTask: Task = {
          id: crypto.randomUUID(),
          content: body.content.trim(),
          status: "pending",
        };
        await this.setState({ tasks: [...this.state.tasks, newTask] });
      }
    }
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

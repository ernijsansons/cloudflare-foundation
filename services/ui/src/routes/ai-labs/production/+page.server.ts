import type { PageServerLoad, Actions } from "./$types";
import { redirect } from "@sveltejs/kit";
import type { PlanningRun, NaomiTask } from "$lib/types";
import { createGatewayClient } from "$lib/server/gateway";

export const actions: Actions = {
  assignToNaomi: async ({ request, platform, fetch, locals }) => {
    const formData = await request.formData();
    const runId = String(formData.get("run_id") ?? "").trim();
    const repoUrl = String(formData.get("repo_url") ?? "").trim();
    if (!runId || !repoUrl) {
      return { success: false, error: "run_id and repo_url are required" };
    }

    try {
      const gateway = createGatewayClient(platform, locals, fetch);
      await gateway.fetchJson("/naomi/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: runId, repo_url: repoUrl }),
      });
    } catch (e) {
      console.error("assignToNaomi error:", e);
      return { success: false, error: e instanceof Error ? e.message : "Failed to create task" };
    }

    throw redirect(303, "/ai-labs/production");
  },

  updateTaskStatus: async ({ request, platform, fetch, locals }) => {
    const formData = await request.formData();
    const taskId = String(formData.get("task_id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const statusMap: Record<string, string> = {
      backlog: "pending",
      "in-progress": "running",
      review: "review",
      done: "completed",
    };
    const apiStatus = statusMap[status] ?? status;
    if (!taskId || !apiStatus) {
      return { success: false, error: "task_id and status are required" };
    }

    try {
      const gateway = createGatewayClient(platform, locals, fetch);
      await gateway.fetchJson(`/naomi/tasks/${taskId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
      });
      return { success: true };
    } catch (e) {
      console.error("updateTaskStatus error:", e);
      return { success: false, error: e instanceof Error ? e.message : "Failed to update status" };
    }
  },
};

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
  try {
    const gateway = createGatewayClient(platform, locals, fetch);

    const runsData = await gateway.fetchJson<{ items?: PlanningRun[] }>(
      "/public/planning/runs?limit=100"
    );
    const runs = runsData.items ?? [];

    let tasks: NaomiTask[] = [];
    try {
      const tasksData = await gateway.fetchJson<{ items?: NaomiTask[] }>(
        "/naomi/tasks?limit=100"
      );
      tasks = tasksData.items ?? [];
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
      // Tasks are optional, continue without them
    }

    return { runs, tasks, error: null };
  } catch (e) {
    console.error("production load error:", e);
    return { runs: [], tasks: [], error: e instanceof Error ? e.message : "Failed to fetch runs" };
  }
};

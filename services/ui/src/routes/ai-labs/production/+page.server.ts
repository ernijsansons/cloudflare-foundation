import type { PageServerLoad, Actions } from "./$types";
import { redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";
import type { PlanningRun, NaomiTask } from "$lib/types";

export const actions: Actions = {
  assignToNaomi: async ({ request, platform }) => {
    const formData = await request.formData();
    const runId = String(formData.get("run_id") ?? "").trim();
    const repoUrl = String(formData.get("repo_url") ?? "").trim();
    if (!runId || !repoUrl) {
      return { success: false, error: "run_id and repo_url are required" };
    }
    const gateway = platform?.env?.GATEWAY;
    if (!gateway) {
      return { success: false, error: "Gateway not configured" };
    }
    let result: { success: false; error: string } | null = null;
    try {
      const res = await gateway.fetch(
        new Request("https://_/api/naomi/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run_id: runId, repo_url: repoUrl }),
        })
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        result = { success: false, error: (err as { error?: string })?.error ?? "Failed to create task" };
      }
    } catch (e) {
      console.error("assignToNaomi error:", e);
      result = { success: false, error: (e as Error).message };
    }
    if (result) return result;
    throw redirect(303, "/ai-labs/production");
  },

  updateTaskStatus: async ({ request, platform }) => {
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
    const gateway = platform?.env?.GATEWAY;
    if (!gateway) {
      return { success: false, error: "Gateway not configured" };
    }
    try {
      const res = await gateway.fetch(
        new Request(`https://_/api/naomi/tasks/${taskId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: apiStatus }),
        })
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: (err as { error?: string })?.error ?? "Failed to update status" };
      }
      return { success: true };
    } catch (e) {
      console.error("updateTaskStatus error:", e);
      return { success: false, error: (e as Error).message };
    }
  },
};

export const load: PageServerLoad = async ({ platform, fetch }) => {
  try {
    const gateway = platform?.env?.GATEWAY;

    let runsRes;
    if (gateway) {
      const request = new Request('https://placeholder/api/public/planning/runs?limit=100&tenant_id=default');
      runsRes = await gateway.fetch(request);
    } else if (dev) {
      runsRes = await fetch("http://127.0.0.1:8787/api/planning/runs?limit=100");
    } else {
      runsRes = await fetch('https://foundation-gateway-production.ernijs-ansons.workers.dev/api/public/planning/runs?limit=100');
    }

    let tasksRes = null;
    try {
      if (gateway) {
        const request = new Request('https://placeholder/api/naomi/tasks?limit=100');
        tasksRes = await gateway.fetch(request);
      } else if (dev) {
        tasksRes = await fetch("http://127.0.0.1:8787/api/naomi/tasks?limit=100");
      } else {
        tasksRes = await fetch('https://foundation-gateway-production.ernijs-ansons.workers.dev/api/naomi/tasks?limit=100');
      }
    } catch {
      tasksRes = null;
    }

    if (!runsRes.ok) {
      const text = await runsRes.text();
      console.error("Failed to fetch production runs:", runsRes.status, text);
      return { runs: [], tasks: [], error: "Failed to fetch runs" };
    }

    const runsData = (await runsRes.json()) as { items?: PlanningRun[] };
    const runs = runsData.items ?? [];

    let tasks: NaomiTask[] = [];
    if (tasksRes?.ok) {
      try {
        const tasksData = (await tasksRes.json()) as { items?: NaomiTask[] };
        tasks = tasksData.items ?? [];
      } catch {
        // Ignore parse errors
      }
    }

    return { runs, tasks, error: null };
  } catch (e) {
    console.error("production load error:", e);
    return { runs: [], tasks: [], error: "Failed to fetch runs" };
  }
};

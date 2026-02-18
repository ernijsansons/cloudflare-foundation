import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform }) => {
  const id = params.id;
  if (!id) {
    return { task: null, error: "Task ID required" };
  }

  const gateway = platform?.env?.GATEWAY;
  if (!gateway) {
    return { task: null, error: "Gateway not configured" };
  }

  try {
    const res = await gateway.fetch(`https://_/api/naomi/tasks/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        return { task: null, error: "Task not found" };
      }
      return { task: null, error: "Failed to fetch task" };
    }

    const task = (await res.json()) as {
      id: string;
      run_id: string;
      repo_url: string;
      agent: string;
      status: string;
      phase?: string;
      vm_id?: string;
      claimed_at?: number;
      started_at?: number;
      completed_at?: number;
      retry_count?: number;
      error?: string;
      created_at: number;
      updated_at?: number;
      logs: Array<{ id: number; phase?: string; level: string; message: string; created_at: number }>;
    };

    return { task, error: null };
  } catch (e) {
    console.error("Task load error:", e);
    return { task: null, error: "Failed to fetch task" };
  }
};

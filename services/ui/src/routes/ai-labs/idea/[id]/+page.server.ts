import type { PageServerLoad, Actions } from "./$types";
import { dev } from "$app/environment";
import { fail, redirect, error } from "@sveltejs/kit";

export interface Idea {
  id: string;
  name: string;
  content: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface Run {
  id: string;
  idea: string;
  refined_idea: string | null;
  status: string;
  current_phase: string | null;
  created_at: number;
}

async function fetchAPI(
  platform: App.Platform | undefined,
  path: string,
  options?: RequestInit
): Promise<Response> {
  if (dev) {
    return fetch(`http://127.0.0.1:8787${path}`, options);
  } else if (platform?.env?.GATEWAY) {
    const publicPath = path.replace("/api/planning/", "/api/public/planning/");
    return platform.env.GATEWAY.fetch(`https://_${publicPath}`, options);
  }
  throw new Error("Gateway not configured");
}

export const load: PageServerLoad = async ({ params, platform }) => {
  try {
    const [ideaRes, runsRes] = await Promise.all([
      fetchAPI(platform, `/api/planning/ideas/${params.id}`),
      fetchAPI(platform, `/api/planning/ideas/${params.id}/runs`),
    ]);

    if (!ideaRes.ok) {
      if (ideaRes.status === 404) {
        error(404, "Idea not found");
      }
      const text = await ideaRes.text();
      console.error("Failed to fetch idea:", ideaRes.status, text);
      error(500, "Failed to fetch idea");
    }

    const idea = (await ideaRes.json()) as Idea;
    const runsData = runsRes.ok ? ((await runsRes.json()) as { items?: Run[] }) : { items: [] };

    return {
      idea,
      runs: runsData.items ?? [],
      error: null,
    };
  } catch (e) {
    if ((e as { status?: number })?.status) {
      throw e;
    }
    console.error("idea detail load error:", e);
    error(500, "Failed to load idea");
  }
};

export const actions: Actions = {
  update: async ({ request, params, platform }) => {
    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const content = formData.get("content")?.toString();
    const status = formData.get("status")?.toString();

    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (content !== undefined) updates.content = content;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return fail(400, { error: "No fields to update" });
    }

    try {
      const res = await fetchAPI(platform, `/api/planning/ideas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to update idea:", res.status, text);
        return fail(500, { error: "Failed to update idea" });
      }

      return { success: true };
    } catch (e) {
      console.error("update idea error:", e);
      return fail(500, { error: "Failed to update idea" });
    }
  },

  delete: async ({ params, platform }) => {
    try {
      const res = await fetchAPI(platform, `/api/planning/ideas/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        return fail(res.status, { error: data.error ?? "Failed to delete idea" });
      }

      redirect(303, "/ai-labs/idea");
    } catch (e) {
      if (e instanceof Response || (e as { status?: number })?.status === 303) {
        throw e;
      }
      console.error("delete idea error:", e);
      return fail(500, { error: "Failed to delete idea" });
    }
  },

  startResearch: async ({ params, platform }) => {
    try {
      const res = await fetchAPI(platform, `/api/planning/ideas/${params.id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cloud" }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to start research:", res.status, text);
        return fail(500, { error: "Failed to start research" });
      }

      const run = (await res.json()) as { id: string };
      redirect(303, `/ai-labs/research/runs/${run.id}`);
    } catch (e) {
      if (e instanceof Response || (e as { status?: number })?.status === 303) {
        throw e;
      }
      console.error("start research error:", e);
      return fail(500, { error: "Failed to start research" });
    }
  },
};

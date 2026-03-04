import type { PageServerLoad, Actions } from "./$types";
import { dev } from "$app/environment";
import { fail, redirect, error } from "@sveltejs/kit";

export interface Attachment {
  name: string;
  key: string;
  type: string;
  size: number;
  uploaded_at: number;
}

export interface Constraint {
  id: string;
  text: string;
  created_at: number;
}

export interface Note {
  id: string;
  text: string;
  created_at: number;
  updated_at: number;
}

export interface Idea {
  id: string;
  name: string;
  content: string;
  status: string;
  description: string;
  priority: string;
  tags: string[];
  deal_stage: string;
  attachments: Attachment[];
  constraints: Constraint[];
  notes: Note[];
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

    const rawIdea = (await ideaRes.json()) as Record<string, unknown>;
    const idea: Idea = {
      id: rawIdea.id as string,
      name: rawIdea.name as string,
      content: rawIdea.content as string,
      status: rawIdea.status as string,
      description: (rawIdea.description as string) ?? '',
      priority: (rawIdea.priority as string) ?? 'normal',
      tags: typeof rawIdea.tags === 'string' ? JSON.parse(rawIdea.tags || '[]') : (rawIdea.tags ?? []) as string[],
      deal_stage: (rawIdea.deal_stage as string) ?? 'idea',
      attachments: typeof rawIdea.attachments === 'string' ? JSON.parse(rawIdea.attachments || '[]') : (rawIdea.attachments ?? []) as Attachment[],
      constraints: typeof rawIdea.constraints === 'string' ? JSON.parse(rawIdea.constraints || '[]') : (rawIdea.constraints ?? []) as Constraint[],
      notes: typeof rawIdea.notes === 'string' ? JSON.parse(rawIdea.notes || '[]') : (rawIdea.notes ?? []) as Note[],
      created_at: rawIdea.created_at as number,
      updated_at: rawIdea.updated_at as number,
    };
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
    const description = formData.get("description")?.toString();

    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (content !== undefined) updates.content = content;
    if (status) updates.status = status;
    if (description !== undefined) updates.description = description;

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

  updateField: async ({ request, params, platform }) => {
    const formData = await request.formData();
    const field = formData.get("field")?.toString();
    const value = formData.get("value")?.toString();

    if (!field || value === undefined) {
      return fail(400, { error: "Field and value required" });
    }

    try {
      const res = await fetchAPI(platform, `/api/planning/ideas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to update field:", res.status, text);
        return fail(500, { error: "Failed to update" });
      }

      return { success: true };
    } catch (e) {
      console.error("updateField error:", e);
      return fail(500, { error: "Failed to update" });
    }
  },
};

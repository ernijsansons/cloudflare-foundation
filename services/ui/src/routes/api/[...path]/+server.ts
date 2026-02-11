import type { RequestHandler } from "./$types";
import type { Fetcher } from "@cloudflare/workers-types";

function proxy(request: Request, path: string, gateway: Fetcher): Promise<Response> {
  const url = `http://_/api/${path}${new URL(request.url).search}`;
  return gateway.fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" ? request.body : undefined,
  });
}

export const GET: RequestHandler = async ({ request, platform, params }) => {
  if (!platform?.env?.GATEWAY) return new Response("Gateway not configured", { status: 503 });
  return proxy(request, params.path ?? "", platform.env.GATEWAY);
};

export const POST: RequestHandler = async ({ request, platform, params }) => {
  if (!platform?.env?.GATEWAY) return new Response("Gateway not configured", { status: 503 });
  return proxy(request, params.path ?? "", platform.env.GATEWAY);
};

export const PATCH: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : new Response("Gateway not configured", { status: 503 }));
export const PUT: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : new Response("Gateway not configured", { status: 503 }));
export const DELETE: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : new Response("Gateway not configured", { status: 503 }));

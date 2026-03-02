import type { RequestHandler } from "./$types";
import type { Fetcher } from "@cloudflare/workers-types";

function getSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/\bsession_id=([^;]+)/);
  return match ? match[1].trim() : null;
}

async function proxy(request: Request, path: string, gateway: Fetcher): Promise<Response> {
  // Strip "gateway/" prefix if present, as the gateway routes don't expect it
  const targetPath = path.startsWith("gateway/") ? path.replace("gateway/", "") : path;
  const url = `http://_/api/${targetPath}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  const sessionId = getSessionIdFromCookie(request.headers.get("Cookie"));
  if (sessionId && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${sessionId}`);
  }
  return gateway.fetch(url, {
    method: request.method,
    headers,
    body: request.method !== "GET" ? request.body : undefined,
  });
}

async function proxyWithoutGateway(request: Request, path: string): Promise<Response> {
  // Strip "gateway/" prefix if present, as the gateway routes don't expect it
  const targetPath = path.startsWith("gateway/") ? path.replace("gateway/", "") : path;

  const target = targetPath.startsWith("public/planning/")
    ? `http://127.0.0.1:8787/api/planning/${targetPath.replace("public/planning/", "")}${new URL(request.url).search}`
    : `http://127.0.0.1:8788/api/${targetPath}${new URL(request.url).search}`;

  // Copy headers and add Authorization from session cookie
  const headers = new Headers(request.headers);
  const sessionId = getSessionIdFromCookie(request.headers.get("Cookie"));
  if (sessionId && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${sessionId}`);
  }

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: request.method !== "GET" ? request.body : undefined,
    });
    // Clone the response to ensure it's a proper Response object for SvelteKit
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  } catch (e) {
    console.error(`Proxy error to ${target}:`, e);
    return new Response(JSON.stringify({ error: "Gateway unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET: RequestHandler = async ({ request, platform, params }) => {
  if (!platform?.env?.GATEWAY) return proxyWithoutGateway(request, params.path ?? "");
  return proxy(request, params.path ?? "", platform.env.GATEWAY);
};

export const POST: RequestHandler = async ({ request, platform, params }) => {
  if (!platform?.env?.GATEWAY) return proxyWithoutGateway(request, params.path ?? "");
  return proxy(request, params.path ?? "", platform.env.GATEWAY);
};

export const PATCH: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : proxyWithoutGateway(e.request, e.params.path ?? ""));
export const PUT: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : proxyWithoutGateway(e.request, e.params.path ?? ""));
export const DELETE: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : proxyWithoutGateway(e.request, e.params.path ?? ""));

import { DurableObject } from "cloudflare:workers";

export interface Env {
  RATE_LIMITER: DurableObjectNamespace;
}

interface RateLimitState {
  requests: number[];
  windowMs: number;
  maxRequests: number;
}

export class TenantRateLimiter extends DurableObject<Env> {
  private state: RateLimitState = {
    requests: [],
    windowMs: 60_000,
    maxRequests: 100,
  };

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/check") return this.checkLimit();
    if (url.pathname === "/configure") {
      const body = (await request.json()) as Partial<RateLimitState>;
      if (body.windowMs) this.state.windowMs = body.windowMs;
      if (body.maxRequests) this.state.maxRequests = body.maxRequests;
      return new Response(JSON.stringify({ configured: true }));
    }
    return new Response("Not found", { status: 404 });
  }

  private checkLimit(): Response {
    const now = Date.now();
    const windowStart = now - this.state.windowMs;
    this.state.requests = this.state.requests.filter((ts) => ts > windowStart);
    if (this.state.requests.length >= this.state.maxRequests) {
      const retryAfter = Math.ceil(
        (this.state.requests[0]! + this.state.windowMs - now) / 1000
      );
      return new Response(
        JSON.stringify({ allowed: false, remaining: 0, retryAfter }),
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(this.state.maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
    this.state.requests.push(now);
    const remaining = this.state.maxRequests - this.state.requests.length;
    return new Response(JSON.stringify({ allowed: true, remaining }), {
      headers: {
        "X-RateLimit-Limit": String(this.state.maxRequests),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  }
}

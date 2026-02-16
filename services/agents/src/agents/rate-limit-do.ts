import { DurableObject } from "cloudflare:workers";

export interface Env {
  RATE_LIMITER: DurableObjectNamespace;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Maximum number of timestamps to keep (prevents unbounded growth)
const MAX_HISTORY_SIZE = 1000;

export class TenantRateLimiter extends DurableObject<Env> {
  private config: RateLimitConfig = {
    windowMs: 60_000,
    maxRequests: 100,
  };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Load config from storage on startup
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<RateLimitConfig>("config");
      if (stored) {
        this.config = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/check") return this.checkLimit();
    if (url.pathname === "/configure") {
      const body = (await request.json()) as Partial<RateLimitConfig>;
      if (body.windowMs) this.config.windowMs = body.windowMs;
      if (body.maxRequests) this.config.maxRequests = body.maxRequests;
      await this.ctx.storage.put("config", this.config);
      return new Response(JSON.stringify({ configured: true }));
    }
    if (url.pathname === "/reset") {
      await this.ctx.storage.delete("requests");
      return new Response(JSON.stringify({ reset: true }));
    }
    return new Response("Not found", { status: 404 });
  }

  private async checkLimit(): Promise<Response> {
    // Use blockConcurrencyWhile for atomic read-modify-write
    // This ensures only one request processes at a time, preventing race conditions
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get current requests from durable storage
      let requests = (await this.ctx.storage.get<number[]>("requests")) || [];

      // Filter out old requests and limit history size
      requests = requests
        .filter((ts) => ts > windowStart)
        .slice(-MAX_HISTORY_SIZE);

      // Check if rate limit exceeded
      if (requests.length >= this.config.maxRequests) {
        const oldestRequest = requests[0] ?? now;
        const retryAfter = Math.ceil(
          (oldestRequest + this.config.windowMs - now) / 1000
        );

        // Still save the cleaned up requests
        await this.ctx.storage.put("requests", requests);

        return new Response(
          JSON.stringify({ allowed: false, remaining: 0, retryAfter }),
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(this.config.maxRequests),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }

      // Add current request timestamp
      requests.push(now);

      // Persist to durable storage
      await this.ctx.storage.put("requests", requests);

      const remaining = this.config.maxRequests - requests.length;
      return new Response(JSON.stringify({ allowed: true, remaining }), {
        headers: {
          "X-RateLimit-Limit": String(this.config.maxRequests),
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    });
  }
}

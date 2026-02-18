import { cleanupOldData, logCleanupResults } from "./jobs/cleanup";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Deep health check - verifies dependencies
    if (url.pathname === "/health") {
      const checks: Record<string, boolean> = {
        db: false,
      };

      // Check database connectivity
      try {
        await env.DB.prepare("SELECT 1").first();
        checks.db = true;
      } catch {
        // DB check failed
      }

      const allHealthy = Object.values(checks).every(Boolean);
      return Response.json(
        {
          status: allHealthy ? "ok" : "degraded",
          service: "foundation-cron",
          timestamp: new Date().toISOString(),
          schedules: ["0 * * * * (hourly)", "0 0 * * * (daily cleanup)"],
          checks,
        },
        { status: allHealthy ? 200 : 503 }
      );
    }

    return new Response("Foundation Cron — scheduled tasks only", { status: 200 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;
    if (cron === "0 * * * *") {
      console.log("Hourly cron:", new Date().toISOString());
    } else if (cron === "0 0 * * *") {
      // Daily cleanup job
      console.log("Daily cleanup cron:", new Date().toISOString());
      ctx.waitUntil(
        cleanupOldData(env.DB).then(logCleanupResults).catch((err) => {
          console.error("Cleanup job failed:", err);
        })
      );
    }
  },
};

import { Hono } from "hono";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.post("/event", async (c) => {
  try {
    const event = (await c.req.json()) as {
      type?: string;
      tenantId?: string;
      metadata?: string;
      value?: number;
    };

    if (c.env.ANALYTICS) {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [
          event.type ?? "",
          event.tenantId ?? "",
          event.metadata ?? "",
        ],
        doubles: [event.value ?? 0],
        indexes: [event.tenantId ?? ""],
      });
    }

    return c.json({ recorded: true });
  } catch (e) {
    console.error("Analytics event error:", e);
    return c.json({ error: "Analytics recording failed" }, 500);
  }
});

export default app;

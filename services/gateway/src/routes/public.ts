import { Hono } from "hono";
import { turnstileMiddleware } from "../middleware/turnstile";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.post("/signup", turnstileMiddleware(), async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  return c.json({ created: true });
});

app.post("/contact", turnstileMiddleware(), async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  return c.json({ sent: true });
});

export default app;

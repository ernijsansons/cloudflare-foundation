import { Hono } from "hono";
import { verifyAuditChain } from "../lib/audit-chain";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get("/audit-verify/:tenantId", async (c) => {
  try {
    const tenantId = c.req.param("tenantId");
    const valid = await verifyAuditChain(c.env.DB, tenantId);
    return c.json({ tenantId, chainValid: valid });
  } catch (e) {
    console.error("Audit verify error:", e);
    return c.json({ error: "Audit verification failed" }, 500);
  }
});

export default app;

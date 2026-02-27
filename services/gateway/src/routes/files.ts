import { Hono } from "hono";
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  MAX_FILENAME_LENGTH,
} from "../constants";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.post("/upload", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "No file" }, 400);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        { error: "File too large", maxSize: MAX_FILE_SIZE },
        413
      );
    }

    // Validate MIME type
    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type as (typeof ALLOWED_FILE_TYPES)[number]
      )
    ) {
      return c.json(
        {
          error: "File type not allowed",
          allowedTypes: ALLOWED_FILE_TYPES,
        },
        415
      );
    }

    // Sanitize filename: remove path traversal, unsafe chars, and truncate
    const sanitizedName = file.name
      .replace(/[/\\:*?"<>|]/g, "_")
      .replace(/\.\./g, "_")
      .slice(0, MAX_FILENAME_LENGTH);

    const key = `tenants/${tenantId}/uploads/${Date.now()}-${sanitizedName}`;
    await c.env.FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: sanitizedName, tenantId },
    });

    return c.json({ key, size: file.size });
  } catch (e) {
    console.error("File upload error:", e);
    return c.json({ error: "File upload failed" }, 500);
  }
});

export default app;

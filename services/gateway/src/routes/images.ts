import { Hono } from "hono";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.post("/transform", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !c.env.IMAGES)
      return c.json({ error: "No file or IMAGES binding" }, 400);

    const images = c.env.IMAGES as {
      input: (
        s: ReadableStream
      ) => {
        transform: (o: object) => {
          output: (o: object) => { response: () => Response };
        };
      };
    };

    const response = images
      .input(file.stream())
      .transform({ width: 256, height: 256 })
      .output({ format: "image/webp" })
      .response();

    return new Response(response.body, { headers: response.headers });
  } catch (e) {
    console.error("Image transform error:", e);
    return c.json({ error: "Image transform failed" }, 500);
  }
});

export default app;

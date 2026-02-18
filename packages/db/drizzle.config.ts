import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  // When running with D1: wrangler d1 execute DB --remote --file=./migrations/XXXX.sql
});

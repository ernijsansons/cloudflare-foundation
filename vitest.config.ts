import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Explicitly scope to services directory to avoid traversing node_modules
    include: ["services/**/*.test.ts", "services/**/*.spec.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.wrangler/**",
      "**/dist/**",
      "**/.svelte-kit/**",
    ],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
    },
    testTimeout: 10000,
  },
});

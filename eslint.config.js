import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * ESLint 9 Flat Config for Cloudflare Foundation
 *
 * This configuration provides:
 * - TypeScript strict type checking
 * - Cloudflare Workers compatibility
 * - Security-focused rules
 */
export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.wrangler/**",
      "**/coverage/**",
      "**/*.d.ts",
    ],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript strict configuration
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  // Global settings for all files
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // Cloudflare Workers globals
        crypto: "readonly",
        caches: "readonly",
        Fetcher: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly",
        File: "readonly",
        Blob: "readonly",
        ReadableStream: "readonly",
        WritableStream: "readonly",
        TransformStream: "readonly",
        WebSocket: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        atob: "readonly",
        btoa: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Cloudflare-specific
        D1Database: "readonly",
        KVNamespace: "readonly",
        R2Bucket: "readonly",
        Queue: "readonly",
        Ai: "readonly",
        VectorizeIndex: "readonly",
        AnalyticsEngineDataset: "readonly",
        DurableObjectNamespace: "readonly",
        DurableObjectState: "readonly",
        Workflow: "readonly",
        WorkflowEvent: "readonly",
        WorkflowStep: "readonly",
      },
    },
  },

  // TypeScript-specific rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Security rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "off", // Too strict for Workers
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",

      // Code quality
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Style preferences
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
  },

  // Test files - relaxed rules
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Config files - CommonJS allowed
  {
    files: ["*.config.js", "*.config.ts", "vitest.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);

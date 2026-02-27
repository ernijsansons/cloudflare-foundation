import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettier from "eslint-config-prettier";

/**
 * ESLint Flat Config for Cloudflare Foundation v2.5
 *
 * Migrated from legacy .eslintrc.json to ESLint 9+ flat config format.
 * See: https://eslint.org/docs/latest/use/configure/configuration-files-new
 */

export default [
  // Base recommended rules
  js.configs.recommended,

  // Global ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/.wrangler/**",
      "**/dist/**",
      "**/.svelte-kit/**",
      "**/build/**",
      "**/.cache/**",
      "**/coverage/**",
    ],
  },

  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        // Browser globals
        console: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        Blob: "readonly",
        File: "readonly",
        ReadableStream: "readonly",
        RequestInit: "readonly",
        BodyInit: "readonly",
        DragEvent: "readonly",
        WebSocket: "readonly",
        WebSocketPair: "readonly",
        crypto: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        atob: "readonly",
        btoa: "readonly",
        PerformanceObserver: "readonly",
        PerformanceEntry: "readonly",
        PerformanceNavigationTiming: "readonly",
        // Node globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // ES2022 globals
        globalThis: "readonly",
        // Web API globals (used in Workers)
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Cloudflare Workers types (runtime globals)
        D1Database: "readonly",
        D1Result: "readonly",
        R2Bucket: "readonly",
        KVNamespace: "readonly",
        DurableObjectNamespace: "readonly",
        DurableObjectState: "readonly",
        ExecutionContext: "readonly",
        ScheduledController: "readonly",
        ScheduledEvent: "readonly",
        Fetcher: "readonly",
        Queue: "readonly",
        Ai: "readonly",
        VectorizeIndex: "readonly",
        VectorizeIndexDetails: "readonly",
        VectorFloatArray: "readonly",
        VectorizeVectorMetadataFilter: "readonly",
        AnalyticsEngineDataset: "readonly",
        Workflow: "readonly",
        SendEmail: "readonly",
        Hyperdrive: "readonly",
        SocketAddress: "readonly",
        SocketOptions: "readonly",
        Socket: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript recommended rules
      ...tsPlugin.configs.recommended.rules,

      // TypeScript specific
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // Best practices
      eqeqeq: ["error", "always"],
      "no-undef": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",

      // Import organization
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-duplicates": "error",
    },
  },

  // Svelte files
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        // Browser globals
        console: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        Blob: "readonly",
        // DOM types
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLDivElement: "readonly",
        Element: "readonly",
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        CustomEvent: "readonly",
        // Svelte 5 runes
        $state: "readonly",
        $derived: "readonly",
        $effect: "readonly",
        $props: "readonly",
        $bindable: "readonly",
        $inspect: "readonly",
        $host: "readonly",
      },
    },
    plugins: {
      svelte: sveltePlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      // Allow function declarations inside Svelte script blocks
      "no-inner-declarations": "off",
      // Allow unused vars with underscore prefix
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // Test files (relaxed rules)
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },

  // Prettier compatibility (must be last)
  prettier,
];

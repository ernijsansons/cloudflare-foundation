import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      // Proxy API requests to planning-machine in development
      "/api/planning": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: "es2020",

    // Optimize bundle size
    minify: "esbuild",
    cssMinify: true,

    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes("node_modules")) {
            // Separate large dependencies
            if (id.includes("@sveltejs")) {
              return "vendor-svelte";
            }
            if (id.includes("drizzle-orm")) {
              return "vendor-drizzle";
            }
            return "vendor";
          }

          // Component chunks by section
          if (id.includes("/ProjectCard/Section")) {
            return "sections";
          }
        },

        // Asset file naming
        chunkFileNames: "chunks/[name]-[hash].js",
        entryFileNames: "entries/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // KB
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["@cloudflare/shared"],
    exclude: [],
  },
});

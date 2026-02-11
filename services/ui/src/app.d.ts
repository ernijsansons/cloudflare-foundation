import type { D1Database, KVNamespace, R2Bucket, Fetcher } from "@cloudflare/workers-types";

declare global {
  namespace App {
    interface Platform {
      env: {
        GATEWAY: Fetcher;
        DB?: D1Database;
        SESSION_KV?: KVNamespace;
        FILES?: R2Bucket;
      };
    }
    interface Locals {
      user?: { tenantId: string; userId: string };
      tenantId?: string;
    }
  }
}

export {};

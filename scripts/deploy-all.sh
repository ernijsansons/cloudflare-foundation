#!/bin/bash
set -euo pipefail

echo "=== Cloudflare Foundation v2.5 — Full Deployment ==="
echo ""

echo "Installing dependencies..."
pnpm install

echo "Building shared packages..."
pnpm --filter @foundation/shared build 2>/dev/null || true
pnpm --filter @foundation/db build 2>/dev/null || true

echo "Running extension codegen..."
npx tsx scripts/codegen-extensions.ts 2>/dev/null || true

echo "Applying D1 migrations (from gateway)..."
cd services/gateway && npx wrangler d1 migrations apply foundation-primary --remote 2>/dev/null || true
cd ../..

echo ""
echo "Deploying services..."

echo "  -> Queues..."
cd services/queues && npx wrangler deploy && cd ../..

echo "  -> Workflows..."
cd services/workflows && npx wrangler deploy && cd ../..

echo "  -> Agents..."
cd services/agents && npx wrangler deploy && cd ../..

echo "  -> Gateway..."
cd services/gateway && npx wrangler deploy && cd ../..

echo "  -> Cron..."
cd services/cron && npx wrangler deploy && cd ../..

echo "  -> UI (SvelteKit)..."
cd services/ui && pnpm run build && npx wrangler deploy && cd ../..

echo ""
echo "All services deployed."
echo "UI: https://foundation-ui.<account>.workers.dev"
echo "Gateway: https://foundation-gateway.<account>.workers.dev"
echo "Agents: https://foundation-agents.<account>.workers.dev"

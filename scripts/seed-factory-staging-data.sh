#!/bin/bash
set -euo pipefail

# Seed deterministic Factory data in staging so smoke tests can always validate
# GET /api/public/factory/build-specs/:runId with a 200 response.

ENVIRONMENT="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WRANGLER_CONFIG="$REPO_ROOT/services/planning-machine/wrangler.jsonc"
DB_NAME="planning-primary-staging"

SEEDED_RUN_ID="factory-smoke-run-staging"
SEEDED_BUILD_SPEC_ID="factory-smoke-build-spec-staging"

if [ "$ENVIRONMENT" != "staging" ]; then
  echo "This seeding script is restricted to staging."
  echo "Usage: $0 [staging]"
  exit 1
fi

if [ ! -f "$WRANGLER_CONFIG" ]; then
  echo "Wrangler config not found: $WRANGLER_CONFIG"
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but was not found on PATH."
  exit 1
fi

if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "Cloudflare auth is required. Run: npx wrangler login"
  exit 1
fi

TMP_SQL="$(mktemp)"
trap 'rm -f "$TMP_SQL"' EXIT

cat > "$TMP_SQL" <<SQL
PRAGMA foreign_keys = ON;

INSERT INTO planning_runs (
  id,
  idea,
  refined_idea,
  status,
  current_phase,
  config,
  quality_score,
  revenue_potential,
  created_at,
  updated_at
) VALUES (
  '${SEEDED_RUN_ID}',
  'Factory smoke seeded run',
  'Factory smoke seeded run',
  'completed',
  'architecture-advisor',
  '{}',
  0.99,
  '{"monthly":0,"currency":"USD"}',
  CAST(strftime('%s', 'now') AS INTEGER),
  CAST(strftime('%s', 'now') AS INTEGER)
)
ON CONFLICT(id) DO UPDATE SET
  idea = excluded.idea,
  refined_idea = excluded.refined_idea,
  status = excluded.status,
  current_phase = excluded.current_phase,
  config = excluded.config,
  quality_score = excluded.quality_score,
  revenue_potential = excluded.revenue_potential,
  updated_at = CAST(strftime('%s', 'now') AS INTEGER);

INSERT INTO build_specs (
  id,
  run_id,
  recommended,
  alternatives,
  data_model,
  api_routes,
  frontend,
  agents,
  free_wins,
  growth_path,
  scaffold_command,
  total_cost,
  status,
  created_at,
  updated_at
) VALUES (
  '${SEEDED_BUILD_SPEC_ID}',
  '${SEEDED_RUN_ID}',
  '{"templateSlug":"hello-world","score":0.99}',
  '[]',
  '{"entities":[]}',
  '[{"method":"GET","path":"/api/public/health"}]',
  '{"framework":"react","pages":["/factory"]}',
  '[{"id":"chief-of-staff","role":"orchestrator"}]',
  '["analytics"]',
  '{"phases":[]}',
  'pnpm create cloudflare@latest',
  '{"monthly":0,"currency":"USD"}',
  'approved',
  datetime('now'),
  datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  run_id = excluded.run_id,
  recommended = excluded.recommended,
  alternatives = excluded.alternatives,
  data_model = excluded.data_model,
  api_routes = excluded.api_routes,
  frontend = excluded.frontend,
  agents = excluded.agents,
  free_wins = excluded.free_wins,
  growth_path = excluded.growth_path,
  scaffold_command = excluded.scaffold_command,
  total_cost = excluded.total_cost,
  status = excluded.status,
  updated_at = datetime('now');
SQL

npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --config "$WRANGLER_CONFIG" \
  --env "$ENVIRONMENT" \
  --file "$TMP_SQL" >/dev/null

echo "SEEDED_RUN_ID=$SEEDED_RUN_ID"
echo "SEEDED_BUILD_SPEC_ID=$SEEDED_BUILD_SPEC_ID"

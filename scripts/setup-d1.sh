#!/bin/bash
echo "Creating D1 database..."
wrangler d1 create foundation-primary
echo "Update wrangler.jsonc in gateway, queues, agents, workflows with database_id from above."
echo "Then run: wrangler d1 migrations apply foundation-primary --remote (from services/gateway)"

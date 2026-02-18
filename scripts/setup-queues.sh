#!/bin/bash
echo "Creating Queues..."
wrangler queues create foundation-audit
wrangler queues create foundation-notifications
wrangler queues create foundation-analytics
wrangler queues create foundation-webhooks
echo "Create DLQs if needed: wrangler queues create foundation-audit-dlq"
echo "Update wrangler.jsonc in gateway and queues with queue names."

#!/bin/bash
echo "Creating KV namespaces..."
wrangler kv:namespace create RATE_LIMIT_KV
wrangler kv:namespace create SESSION_KV
wrangler kv:namespace create CACHE_KV
echo "Update wrangler.jsonc with id values from above."

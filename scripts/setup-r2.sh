#!/bin/bash
echo "Creating R2 buckets..."
wrangler r2 bucket create foundation-files
wrangler r2 bucket create foundation-assets
echo "Buckets created. Binding names: FILES, ASSETS."

/**
 * Seed All — Combined Template Registry + CF Capabilities
 *
 * Project Factory v3.0
 *
 * This is a simple marker file. To seed both tables, run:
 *
 *   npx tsx scripts/seed-registry.ts | npx wrangler d1 execute planning-primary --remote --command=-
 *   npx tsx scripts/seed-capabilities.ts | npx wrangler d1 execute planning-primary --remote --command=-
 *
 * Or to combine in one command (PowerShell):
 *   (npx tsx scripts/seed-registry.ts ; npx tsx scripts/seed-capabilities.ts) | npx wrangler d1 execute planning-primary --remote --command=-
 *
 * Bash:
 *   { npx tsx scripts/seed-registry.ts && npx tsx scripts/seed-capabilities.ts; } | npx wrangler d1 execute planning-primary --remote --command=-
 */

/* eslint-disable no-console */

console.log('-- Use the commands above to seed both tables.');
console.log('-- Run seed-registry.ts and seed-capabilities.ts separately or combine them.');

/**
 * Code Generators Index (Phase 1.6 + Foundation v2.5)
 * Exports all executable artifact generators
 */

export { generateSQLDDL } from './sql-generator';
export { generateOpenAPISpec } from './openapi-generator';
export { generateWranglerConfig } from './wrangler-generator'; // Legacy .toml
export { generateWranglerJSONC } from './wrangler-jsonc-generator'; // Foundation v2.5 preferred

// Export types
export type { TechArchOutput } from '../../schemas/tech-arch';

/**
 * Payload Schema Registry
 *
 * Central registry of all payload schemas with versioning
 */

import { PHASE_SCHEMAS } from './schema-validator';

export interface SchemaRegistryEntry {
  name: string;
  version: string;
  schema: unknown;
  description?: string;
  createdAt: Date;
}

export interface SchemaVersion {
  version: string;
  schema: unknown;
  deprecated?: boolean;
  replacedBy?: string;
}

/**
 * Schema Registry - manages all schemas and their versions
 */
export class SchemaRegistry {
  private schemas: Map<string, SchemaVersion[]> = new Map();

  constructor() {
    // Register all phase schemas
    this.registerPhaseSchemas();
  }

  /**
   * Register phase schemas from schema-validator
   */
  private registerPhaseSchemas(): void {
    for (const [phaseName, schema] of Object.entries(PHASE_SCHEMAS)) {
      this.register(phaseName, '1.0.0', schema, `${phaseName} phase output schema`);
    }
  }

  /**
   * Register a new schema or version
   */
  register(
    name: string,
    version: string,
    schema: unknown,
    description?: string
  ): void {
    if (!this.schemas.has(name)) {
      this.schemas.set(name, []);
    }

    const versions = this.schemas.get(name)!;
    versions.push({ version, schema });
  }

  /**
   * Get schema by name and version
   */
  getSchema(name: string, version?: string): unknown | null {
    const versions = this.schemas.get(name);
    if (!versions || versions.length === 0) return null;

    if (version) {
      const found = versions.find((v) => v.version === version);
      return found?.schema || null;
    }

    // Return latest version if no version specified
    return versions[versions.length - 1].schema;
  }

  /**
   * List all registered schemas
   */
  list(): SchemaRegistryEntry[] {
    const entries: SchemaRegistryEntry[] = [];

    for (const [name, versions] of this.schemas.entries()) {
      for (const version of versions) {
        entries.push({
          name,
          version: version.version,
          schema: version.schema,
          createdAt: new Date(),
        });
      }
    }

    return entries;
  }

  /**
   * Get all versions of a schema
   */
  getVersions(name: string): SchemaVersion[] {
    return this.schemas.get(name) || [];
  }
}

// Global registry instance
export const schemaRegistry = new SchemaRegistry();

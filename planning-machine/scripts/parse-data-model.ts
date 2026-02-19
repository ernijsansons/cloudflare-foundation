/**
 * Parser for DATA_MODEL.md - extracts Entity-Storage Map (D1 tables → Drizzle schema)
 * Supports: (1) YAML frontmatter with full schema, (2) Markdown table parsing
 */

import * as fs from "node:fs";

export interface ColumnDef {
  name: string;
  type: "text" | "integer" | "real" | "blob";
  primaryKey?: boolean;
  notNull?: boolean;
  default?: string;
  autoIncrement?: boolean;
}

export interface EntityDef {
  name: string;
  table: string;
  storage: "D1" | "KV" | "R2";
  columns?: ColumnDef[];
}

export interface ParsedDataModel {
  entities: EntityDef[];
  d1DatabaseName?: string;
}

const ENTITY_STORAGE_PATTERN =
  /^\s*\|?\s*(?:Entity|entity)\s*\|?\s*(?:Storage|storage)\s*\|?\s*(?:Table|table)\s*\|?/im;
const TABLE_ROW_PATTERN = /^\s*\|?\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|?/;

/**
 * Parse markdown table for entity-storage map.
 * Expects format:
 * | Entity | Storage | Table |
 * |--------|---------|-------|
 * | User   | D1      | users |
 */
function parseEntityStorageTable(content: string): EntityDef[] {
  const entities: EntityDef[] = [];
  const lines = content.split("\n");
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ENTITY_STORAGE_PATTERN.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable) {
      // Skip separator row (|---|---|)
      if (/^\s*\|?\s*[-:]+\s*\|/.test(line)) continue;
      const match = line.match(TABLE_ROW_PATTERN);
      if (match) {
        const [, entity, storage, table] = match.map((s) => s.trim());
        if (entity && storage && table && !entity.startsWith("-")) {
          const storageUpper = storage.toUpperCase();
          if (storageUpper === "D1" || storageUpper === "KV" || storageUpper === "R2") {
            entities.push({
              name: entity,
              table: table,
              storage: storageUpper as "D1" | "KV" | "R2",
            });
          }
        }
      } else {
        // End of table
        inTable = false;
      }
    }
  }

  return entities;
}

/**
 * Parse YAML block that might be embedded in markdown (frontmatter or ```yaml block).
 * Uses optional yaml package; falls back to null if not available.
 */
async function parseYamlBlock(content: string): Promise<Partial<ParsedDataModel> | null> {
  try {
    const matter = content.match(/^---\s*\n([\s\S]*?)\n---/);
    const yamlBlock = content.match(/```(?:yaml|yml)\s*\n([\s\S]*?)```/);
    const yamlContent = matter?.[1] ?? yamlBlock?.[1];
    if (!yamlContent) return null;

    const mod = await import("yaml").catch(() => null);
    if (!mod?.parse) return null;
    return mod.parse(yamlContent) as Partial<ParsedDataModel>;
  } catch {
    return null;
  }
}

/**
 * Convert entity name to Drizzle column type.
 */
function defaultColumnsForEntity(entityName: string, tableName: string): ColumnDef[] {
  const base: ColumnDef[] = [
    { name: "id", type: "text", primaryKey: true, notNull: true },
    { name: "created_at", type: "integer", notNull: true },
  ];
  if (tableName === "users") {
    base.splice(1, 0, { name: "tenant_id", type: "text", notNull: true });
  }
  return base;
}

/**
 * Parse DATA_MODEL.md file.
 */
export async function parseDataModel(
  content: string,
  options?: { inferColumns?: boolean }
): Promise<ParsedDataModel> {
  const inferColumns = options?.inferColumns ?? true;

  const yamlResult = await parseYamlBlock(content);
  if (yamlResult?.entities && Array.isArray(yamlResult.entities)) {
    return {
      entities: yamlResult.entities,
      d1DatabaseName: yamlResult.d1DatabaseName,
    };
  }

  const tableEntities = parseEntityStorageTable(content);
  if (tableEntities.length === 0) {
    return { entities: [] };
  }

  if (inferColumns) {
    for (const e of tableEntities) {
      if (!e.columns || e.columns.length === 0) {
        e.columns = defaultColumnsForEntity(e.name, e.table);
      }
    }
  }

  return {
    entities: tableEntities,
    d1DatabaseName: yamlResult?.d1DatabaseName,
  };
}

/**
 * Parse DATA_MODEL.md from file path.
 */
export async function parseDataModelFile(
  filePath: string,
  options?: { inferColumns?: boolean }
): Promise<ParsedDataModel> {
  const content = fs.readFileSync(filePath, "utf-8");
  return parseDataModel(content, options);
}

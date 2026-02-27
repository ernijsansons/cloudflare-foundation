/**
 * Generate Drizzle schema from parsed DATA_MODEL entities
 */

import type { EntityDef } from "./parse-data-model.js";
import * as fs from "node:fs";
import * as path from "node:path";

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function generateTableFile(entity: EntityDef): string {
  const tableName = entity.table;
  const varName = tableName.replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase());
  const exportName = varName.charAt(0).toLowerCase() + varName.slice(1);

  const columns = entity.columns ?? [
    { name: "id", type: "text" as const, primaryKey: true, notNull: true },
    { name: "created_at", type: "integer" as const, notNull: true },
  ];

  const colLines = columns.map((c) => {
    const snakeName = c.name.replace(/([A-Z])/g, "_$1").toLowerCase();
    const tsName = toCamelCase(snakeName);
    const isTimestamp =
      snakeName.includes("created") ||
      snakeName.includes("updated") ||
      snakeName.includes("timestamp");

    let typeStr: string;
    if (c.type === "integer" && isTimestamp) {
      typeStr = `integer("${snakeName}", { mode: "timestamp" })`;
    } else {
      typeStr = `${c.type}("${snakeName}")`;
    }

    let chain = "";
    if (c.primaryKey && c.autoIncrement) {
      chain = ".primaryKey({ autoIncrement: true }).notNull()";
    } else if (c.primaryKey) {
      chain = ".primaryKey()";
    } else if (c.notNull) {
      chain = ".notNull()";
    }
    if (c.default) {
      chain += `.default("${c.default}")`;
    }

    return `  ${tsName}: ${typeStr}${chain}`;
  });

  return `import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ${exportName} = sqliteTable("${tableName}", {
${colLines.join(",\n")},
});
`;
}

function tableToExport(tableName: string): string {
  const varName = tableName.replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase());
  return varName.charAt(0).toLowerCase() + varName.slice(1);
}

/**
 * Generate Drizzle schema files in packages/db/schema/
 * Merges with foundation base tables (audit-chain, audit-log, tenants, users).
 */
export function generateDrizzleSchema(
  entities: EntityDef[],
  outputDir: string,
  options?: { keepFoundationTables?: boolean }
): void {
  const keepFoundation = options?.keepFoundationTables ?? true;
  const schemaDir = path.join(outputDir, "packages", "db", "schema");
  fs.mkdirSync(schemaDir, { recursive: true });

  const d1Entities = entities.filter((e) => e.storage === "D1");
  const writtenTables = new Set<string>();

  for (const entity of d1Entities) {
    const content = generateTableFile(entity);
    const filePath = path.join(schemaDir, `${entity.table}.ts`);
    fs.writeFileSync(filePath, content, "utf-8");
    writtenTables.add(entity.table);
  }

  const allTables: string[] = [];
  if (keepFoundation) {
    const foundationTables = ["audit-chain", "audit-log", "tenants", "users"];
    for (const t of foundationTables) {
      if (!writtenTables.has(t)) {
        allTables.push(t);
      }
    }
  }
  for (const t of writtenTables) {
    allTables.push(t);
  }

  const indexContent = allTables
    .map((t) => `export { ${tableToExport(t)} } from "./${t}";`)
    .join("\n");

  fs.writeFileSync(
    path.join(schemaDir, "index.ts"),
    indexContent + "\n",
    "utf-8"
  );
}

/**
 * Parser for PRODUCT_ARCHITECTURE.md - extracts service names, D1 names, config
 */

import * as fs from "node:fs";

export interface ProductArchitecture {
  serviceName?: string;
  d1DatabaseName?: string;
  gatewayName?: string;
  uiName?: string;
  agentsName?: string;
  workflowsName?: string;
  [key: string]: string | undefined;
}

const PATTERNS: Array<{ key: keyof ProductArchitecture; regex: RegExp }> = [
  { key: "serviceName", regex: /(?:service|project|product)\s+name[:\s]+\s*["']?([\w-]+)["']?/gi },
  { key: "d1DatabaseName", regex: /d1\s+(?:database\s+)?name[:\s]+\s*["']?([\w-]+)["']?/gi },
  { key: "gatewayName", regex: /gateway\s+(?:service\s+)?name[:\s]+\s*["']?([\w-]+)["']?/gi },
  { key: "uiName", regex: /ui\s+(?:service\s+)?name[:\s]+\s*["']?([\w-]+)["']?/gi },
  { key: "agentsName", regex: /agents?\s+(?:service\s+)?name[:\s]+\s*["']?([\w-]+)["']?/gi },
  { key: "workflowsName", regex: /workflow\s+(?:service\s+)?name[:\s]+\s*["']?([\w-]+)["']?/gi },
];

/**
 * Parse PRODUCT_ARCHITECTURE.md for product-specific config.
 */
export function parseProductArchitecture(content: string): ProductArchitecture {
  const result: ProductArchitecture = {};

  for (const { key, regex } of PATTERNS) {
    const m = regex.exec(content);
    if (m && m[1]) {
      result[key] = m[1].trim();
    }
  }

  // Fallback: if serviceName not found, try to infer from title
  if (!result.serviceName) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      result.serviceName = titleMatch[1]
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
  }

  return result;
}

/**
 * Parse PRODUCT_ARCHITECTURE.md from file path.
 */
export function parseProductArchitectureFile(filePath: string): ProductArchitecture {
  const content = fs.readFileSync(filePath, "utf-8");
  return parseProductArchitecture(content);
}

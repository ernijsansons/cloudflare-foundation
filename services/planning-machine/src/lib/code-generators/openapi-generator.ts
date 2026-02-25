/**
 * OpenAPI Spec Generator (Phase 1.6)
 * Generates executable OpenAPI 3.1 YAML from tech-arch API routes
 */

import type { TechArchOutput } from "../../schemas/tech-arch";

export function generateOpenAPISpec(techArchOutput: TechArchOutput, projectName: string = "Generated API"): string {
  const routes = techArchOutput.apiRoutes?.routes || [];

  if (!Array.isArray(routes) || routes.length === 0) {
    return "# No API routes defined\n";
  }

  const spec: string[] = [];

  spec.push("openapi: 3.1.0");
  spec.push("info:");
  spec.push(`  title: ${projectName} API`);
  spec.push("  version: 1.0.0");
  spec.push(`  description: Auto-generated API specification from Planning Machine`);
  spec.push("");
  spec.push("servers:");
  spec.push("  - url: https://api.example.com");
  spec.push("    description: Production");
  spec.push("  - url: https://api-staging.example.com");
    spec.push("    description: Staging");
  spec.push("");
  spec.push("paths:");

  // Group routes by path
  const pathMap = new Map<string, any[]>();
  for (const route of routes) {
    if (typeof route !== 'object' || !route.path) continue;
    if (!pathMap.has(route.path)) {
      pathMap.set(route.path, []);
    }
    pathMap.get(route.path)!.push(route);
  }

  // Generate path definitions
  for (const [path, pathRoutes] of pathMap.entries()) {
    spec.push(`  ${path}:`);

    for (const route of pathRoutes) {
      const method = (route.method || 'GET').toLowerCase();
      spec.push(`    ${method}:`);
      spec.push(`      summary: ${method.toUpperCase()} ${path}`);
      spec.push(`      operationId: ${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`);

      // Tags
      const tag = path.split('/')[1] || 'default';
      spec.push(`      tags:`);
      spec.push(`        - ${tag}`);

      // Security
      if (route.auth === 'required') {
        spec.push(`      security:`);
        spec.push(`        - bearerAuth: []`);
      }

      // Request body
      if (route.requestBody && ['post', 'put', 'patch'].includes(method)) {
        spec.push(`      requestBody:`);
        spec.push(`        required: true`);
        spec.push(`        content:`);
        spec.push(`          application/json:`);
        spec.push(`            schema:`);
        spec.push(`              type: object`);
        if (typeof route.requestBody === 'object' && route.requestBody !== null) {
          spec.push(`              properties:`);
          for (const [key, value] of Object.entries(route.requestBody)) {
            spec.push(`                ${key}:`);
            spec.push(`                  type: ${inferType(value)}`);
          }
        }
      }

      // Responses
      spec.push(`      responses:`);
      spec.push(`        '200':`);
      spec.push(`          description: Successful response`);

      if (route.responseBody) {
        spec.push(`          content:`);
        spec.push(`            application/json:`);
        spec.push(`              schema:`);
        spec.push(`                type: object`);
        if (typeof route.responseBody === 'object' && route.responseBody !== null) {
          spec.push(`                properties:`);
          for (const [key, value] of Object.entries(route.responseBody)) {
            spec.push(`                  ${key}:`);
            spec.push(`                    type: ${inferType(value)}`);
          }
        }
      }

      spec.push(`        '400':`);
      spec.push(`          description: Bad request`);
      spec.push(`        '401':`);
      spec.push(`          description: Unauthorized`);
      spec.push(`        '500':`);
      spec.push(`          description: Internal server error`);
    }
  }

  // Security schemes
  spec.push("");
  spec.push("components:");
  spec.push("  securitySchemes:");
  spec.push("    bearerAuth:");
  spec.push("      type: http");
  spec.push("      scheme: bearer");
  spec.push("      bearerFormat: JWT");

  return spec.join("\n");
}

function inferType(value: unknown): string {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string';
}

/**
 * Project Documentation API Routes
 *
 * Provides CRUD operations for comprehensive project documentation
 * across 13 sections (A-M) plus auto-generated Overview.
 */

import { Hono } from "hono";
import type {
  Env,
  Variables,
  ProjectDocumentation,
  ProjectDocumentationRow,
  ProjectDocumentationMetadataRow,
  GetProjectDocsResponse,
  GetSectionResponse,
  UpdateSectionRequest,
  SectionId,
  OverviewSection,
} from "../types";
import { generateOverview } from "../lib/doc-generator";

const projectDocsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================================
// GET /api/projects/:projectId/docs
// Retrieve all documentation sections for a project
// ============================================================================
projectDocsRouter.get("/api/projects/:projectId/docs", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const tenantId = c.get("tenantId") ?? "default";

    // Fetch all documentation rows for this project
    const docsResult = await c.env.DB.prepare(
      `SELECT * FROM project_documentation WHERE project_id = ? ORDER BY section_id, subsection_key`
    ).bind(projectId).all<ProjectDocumentationRow>();

    if (!docsResult.results) {
      return c.json({ error: "Failed to fetch documentation" }, 500);
    }

    // Fetch metadata
    const metadataResult = await c.env.DB.prepare(
      `SELECT * FROM project_documentation_metadata WHERE project_id = ?`
    ).bind(projectId).first<ProjectDocumentationMetadataRow>();

    // Group documentation by section
    const sections: Partial<ProjectDocumentation> = {};

    for (const row of docsResult.results) {
      try {
        const content = JSON.parse(row.content);

        if (!sections[row.section_id as SectionId]) {
          sections[row.section_id as SectionId] = {};
        }

        if (row.subsection_key) {
          sections[row.section_id as SectionId]![row.subsection_key] = content;
        } else {
          sections[row.section_id as SectionId] = content;
        }
      } catch (e) {
        console.error(`Failed to parse content for section ${row.section_id}:`, e);
      }
    }

    const response: GetProjectDocsResponse = {
      project_id: projectId,
      sections,
      metadata: metadataResult
        ? {
            completeness: metadataResult.completeness_percentage,
            last_updated: metadataResult.last_updated,
            status: metadataResult.status,
          }
        : {
            completeness: 0,
            last_updated: Math.floor(Date.now() / 1000),
            status: "incomplete",
          },
    };

    return c.json(response);
  } catch (e) {
    console.error("Get project docs error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ============================================================================
// GET /api/projects/:projectId/docs/sections/:sectionId
// Retrieve a specific section
// ============================================================================
projectDocsRouter.get("/api/projects/:projectId/docs/sections/:sectionId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const sectionId = c.req.param("sectionId");

    const docsResult = await c.env.DB.prepare(
      `SELECT * FROM project_documentation WHERE project_id = ? AND section_id = ? ORDER BY subsection_key`
    ).bind(projectId, sectionId).all<ProjectDocumentationRow>();

    if (!docsResult.results) {
      return c.json({ error: "Failed to fetch section" }, 500);
    }

    if (docsResult.results.length === 0) {
      return c.json({ error: "Section not found" }, 404);
    }

    // Combine all subsections
    const content: Record<string, unknown> = {};
    const subsections: Record<string, unknown> = {};
    let latestUpdate = 0;

    for (const row of docsResult.results) {
      try {
        const parsedContent = JSON.parse(row.content);

        if (row.subsection_key) {
          subsections[row.subsection_key] = parsedContent;
        } else {
          Object.assign(content, parsedContent);
        }

        if (row.last_updated > latestUpdate) {
          latestUpdate = row.last_updated;
        }
      } catch (e) {
        console.error(`Failed to parse content for subsection ${row.subsection_key}:`, e);
      }
    }

    const response: GetSectionResponse = {
      section_id: sectionId,
      content,
      subsections,
      status: docsResult.results[0].status,
      last_updated: latestUpdate,
    };

    return c.json(response);
  } catch (e) {
    console.error("Get section error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ============================================================================
// PUT /api/projects/:projectId/docs/sections/:sectionId
// Update a specific section or subsection
// ============================================================================
projectDocsRouter.put("/api/projects/:projectId/docs/sections/:sectionId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const sectionId = c.req.param("sectionId");
    const body = (await c.req.json()) as UpdateSectionRequest;

    const { subsection_key, content, status } = body;

    if (!content || typeof content !== "object") {
      return c.json({ error: "content is required and must be an object" }, 400);
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const contentJson = JSON.stringify(content);

    // Upsert the documentation row
    await c.env.DB.prepare(
      `INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_id, section_id, subsection_key)
       DO UPDATE SET content = ?, status = ?, last_updated = ?`
    )
      .bind(
        id,
        projectId,
        sectionId,
        subsection_key ?? null,
        contentJson,
        status ?? "draft",
        "manual",
        now,
        now,
        // ON CONFLICT update values
        contentJson,
        status ?? "draft",
        now
      )
      .run();

    // Update metadata - calculate completeness
    await updateDocumentationMetadata(c.env.DB, projectId);

    return c.json({ success: true, updated: true });
  } catch (e) {
    console.error("Update section error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ============================================================================
// POST /api/projects/:projectId/docs/generate-overview
// Auto-generate Overview tab from all sections
// ============================================================================
projectDocsRouter.post("/api/projects/:projectId/docs/generate-overview", async (c) => {
  try {
    const projectId = c.req.param("projectId");

    // Fetch all sections
    const docsResult = await c.env.DB.prepare(
      `SELECT * FROM project_documentation WHERE project_id = ? ORDER BY section_id, subsection_key`
    ).bind(projectId).all<ProjectDocumentationRow>();

    if (!docsResult.results) {
      return c.json({ error: "Failed to fetch documentation" }, 500);
    }

    // Parse sections
    const sections: Partial<ProjectDocumentation> = {} as Partial<ProjectDocumentation>;

    for (const row of docsResult.results) {
      try {
        const content = JSON.parse(row.content);

        if (!sections[row.section_id as SectionId]) {
          sections[row.section_id as SectionId] = {} as never;
        }

        if (row.subsection_key) {
          (sections[row.section_id as SectionId] as Record<string, unknown>)[row.subsection_key] = content;
        } else {
          sections[row.section_id as SectionId] = content as never;
        }
      } catch (e) {
        console.error(`Failed to parse content for section ${row.section_id}:`, e);
      }
    }

    // Generate overview
    const overview = generateOverview(sections);

    // Save overview back to database
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB.prepare(
      `INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_id, section_id, subsection_key)
       DO UPDATE SET content = ?, last_updated = ?`
    )
      .bind(
        id,
        projectId,
        "overview",
        null,
        JSON.stringify(overview),
        "draft",
        "auto-generated",
        now,
        now,
        // ON CONFLICT update values
        JSON.stringify(overview),
        now
      )
      .run();

    return c.json({ overview });
  } catch (e) {
    console.error("Generate overview error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ============================================================================
// GET /api/projects/:projectId/docs/export
// Export documentation in various formats
// ============================================================================
projectDocsRouter.get("/api/projects/:projectId/docs/export", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const format = c.req.query("format") ?? "json";

    // Fetch all documentation
    const docsResult = await c.env.DB.prepare(
      `SELECT * FROM project_documentation WHERE project_id = ? ORDER BY section_id, subsection_key`
    ).bind(projectId).all<ProjectDocumentationRow>();

    if (!docsResult.results) {
      return c.json({ error: "Failed to fetch documentation" }, 500);
    }

    // Parse sections
    const sections: Partial<ProjectDocumentation> = {};

    for (const row of docsResult.results) {
      try {
        const content = JSON.parse(row.content);

        if (!sections[row.section_id as SectionId]) {
          sections[row.section_id as SectionId] = {};
        }

        if (row.subsection_key) {
          sections[row.section_id as SectionId]![row.subsection_key] = content;
        } else {
          sections[row.section_id as SectionId] = content;
        }
      } catch (e) {
        console.error(`Failed to parse content for section ${row.section_id}:`, e);
      }
    }

    if (format === "json") {
      return c.json(sections);
    }

    if (format === "markdown") {
      const markdown = convertToMarkdown(sections, projectId);
      return c.text(markdown, 200, {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="project-${projectId}-documentation.md"`,
      });
    }

    // PDF export would require additional library (e.g., puppeteer, jsPDF)
    // For now, return JSON as fallback
    return c.json({ error: "Format not supported. Use 'json' or 'markdown'" }, 400);
  } catch (e) {
    console.error("Export documentation error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updateDocumentationMetadata(db: D1Database, projectId: string) {
  // Count populated sections
  const countResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT section_id) as populated_sections FROM project_documentation WHERE project_id = ? AND section_id != 'overview'`
    )
    .bind(projectId)
    .first<{ populated_sections: number }>();

  const populatedSections = countResult?.populated_sections ?? 0;
  const totalSections = 13; // A through M
  const completeness = Math.floor((populatedSections / totalSections) * 100);

  // Check if unknowns are resolved (from Section A)
  const unknownsResult = await db
    .prepare(`SELECT content FROM project_documentation WHERE project_id = ? AND section_id = 'A' AND subsection_key = 'A1_unknowns'`)
    .bind(projectId)
    .first<{ content: string }>();

  let unknownsResolved = 0;
  if (unknownsResult) {
    try {
      const unknowns = JSON.parse(unknownsResult.content);
      unknownsResolved = Object.values(unknowns).filter((v) => v === "RESOLVED").length;
    } catch (e) {
      console.error("Failed to parse unknowns:", e);
    }
  }

  const status = completeness >= 90 && unknownsResolved >= 5 ? "complete" : "incomplete";
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO project_documentation_metadata (project_id, completeness_percentage, total_sections, populated_sections, required_unknowns_resolved, status, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_id)
       DO UPDATE SET completeness_percentage = ?, populated_sections = ?, required_unknowns_resolved = ?, status = ?, last_updated = ?`
    )
    .bind(
      projectId,
      completeness,
      totalSections,
      populatedSections,
      unknownsResolved,
      status,
      now,
      // ON CONFLICT update values
      completeness,
      populatedSections,
      unknownsResolved,
      status,
      now
    )
    .run();
}

function convertToMarkdown(sections: Partial<ProjectDocumentation>, projectId: string): string {
  let md = `# Project Documentation: ${projectId}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // Overview
  if (sections.overview) {
    md += `## Overview\n\n`;
    md += `**Concept:** ${(sections.overview as OverviewSection).executive_summary?.concept}\n\n`;
    md += `**Status:** ${(sections.overview as OverviewSection).executive_summary?.status}\n\n`;
    md += `**Completeness:** ${(sections.overview as OverviewSection).executive_summary?.completeness}%\n\n`;
    md += `---\n\n`;
  }

  // All other sections
  const sectionNames: Record<string, string> = {
    A: "Assumptions + Inputs",
    B: "North Star",
    C: "Master Checklist",
    D: "Cloudflare Architecture",
    E: "Frontend System",
    F: "Backend/Middleware",
    G: "Pricing + Unit Economics",
    H: "Go-to-Market",
    I: "Brand Identity",
    J: "Security + Compliance",
    K: "Testing + Observability",
    L: "Operations Playbook",
    M: "Execution Roadmap",
  };

  for (const [sectionId, sectionName] of Object.entries(sectionNames)) {
    if (sections[sectionId as SectionId]) {
      md += `## Section ${sectionId}: ${sectionName}\n\n`;
      md += `\`\`\`json\n${JSON.stringify(sections[sectionId as SectionId], null, 2)}\n\`\`\`\n\n`;
      md += `---\n\n`;
    }
  }

  return md;
}

export default projectDocsRouter;

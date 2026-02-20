/**
 * Documentation Populator
 *
 * Automatically populates project documentation as planning phases complete.
 * Bridges the gap between planning pipeline and documentation system.
 */

import { mapPhaseToSections, batchUpdateSections } from "./phase-to-section-mapper";

interface PopulateDocumentationParams {
  db: D1Database;
  projectId: string;
  phase: string;
  phaseOutput: unknown;
}

interface PopulateDocumentationResult {
  success: boolean;
  sectionsUpdated: number;
  error?: string;
}

/**
 * Populate project documentation after a phase completes
 *
 * This is called automatically by the planning workflow after each phase.
 * It maps the phase output to documentation sections and updates the database.
 */
export async function populateDocumentation(params: PopulateDocumentationParams): Promise<PopulateDocumentationResult> {
  const { db, projectId, phase, phaseOutput } = params;

  try {
    console.log(`Populating documentation for project ${projectId}, phase ${phase}`);

    // Map phase output to section updates
    const sectionUpdates = mapPhaseToSections({
      phase,
      data: phaseOutput,
      runId: projectId,
    });

    if (sectionUpdates.length === 0) {
      console.log(`No section updates generated for phase ${phase}`);
      return {
        success: true,
        sectionsUpdated: 0,
      };
    }

    console.log(`Generated ${sectionUpdates.length} section updates for phase ${phase}`);

    // Batch update sections in database
    const result = await batchUpdateSections(db, projectId, sectionUpdates);

    if (!result.success) {
      return {
        success: false,
        sectionsUpdated: 0,
        error: result.error,
      };
    }

    return {
      success: true,
      sectionsUpdated: sectionUpdates.length,
    };
  } catch (error) {
    console.error(`Failed to populate documentation for phase ${phase}:`, error);
    return {
      success: false,
      sectionsUpdated: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate overview section after all phases complete
 *
 * This should be called after Phase 15 (Synthesis) completes.
 * It aggregates all sections and generates the auto-summary Overview.
 */
export async function generateOverviewSection(db: D1Database, projectId: string): Promise<PopulateDocumentationResult> {
  try {
    console.log(`Generating overview section for project ${projectId}`);

    // Fetch all documentation sections
    const docsResult = await db
      .prepare(
        `SELECT * FROM project_documentation WHERE project_id = ? ORDER BY section_id, subsection_key`
      )
      .bind(projectId)
      .all();

    if (!docsResult.results) {
      return {
        success: false,
        sectionsUpdated: 0,
        error: "Failed to fetch documentation for overview generation",
      };
    }

    // Parse sections (simplified - in production, use doc-generator.ts logic)
    const sections: Record<string, unknown> = {};

    for (const row of docsResult.results as Array<{ section_id: string; subsection_key: string | null; content: string }>) {
      try {
        const content = JSON.parse(row.content);

        if (!sections[row.section_id]) {
          sections[row.section_id] = {};
        }

        if (row.subsection_key) {
          (sections[row.section_id] as Record<string, unknown>)[row.subsection_key] = content;
        } else {
          sections[row.section_id] = content;
        }
      } catch (e) {
        console.error(`Failed to parse content for section ${row.section_id}:`, e);
      }
    }

    // Generate overview (basic version - full version uses doc-generator.ts)
    const overview = {
      executive_summary: {
        concept: "Auto-generated from Section A",
        status: "planning",
        completeness: calculateCompleteness(sections),
        key_metrics: {},
      },
      quick_stats: {
        budget: "TBD",
        timeline: "TBD",
        north_star_metric: "TBD",
        current_phase: "Synthesis Complete",
      },
      health_indicators: {
        documentation_complete: calculateCompleteness(sections) >= 90,
        unknowns_resolved: true,
        checklist_progress: 0,
        security_coverage: 0,
      },
      critical_path: {
        next_milestone: "Begin implementation",
        blockers: [],
        dependencies: [],
      },
      quick_actions: [
        { label: "Review Documentation", link: "#" },
        { label: "Start Implementation", link: "#" },
      ],
    };

    // Save overview
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
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

    return {
      success: true,
      sectionsUpdated: 1,
    };
  } catch (error) {
    console.error(`Failed to generate overview section:`, error);
    return {
      success: false,
      sectionsUpdated: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Calculate documentation completeness percentage
 */
function calculateCompleteness(sections: Record<string, unknown>): number {
  const totalSections = 13; // A through M
  const populatedSections = Object.keys(sections).filter((key) => key !== "overview" && sections[key]).length;
  return Math.floor((populatedSections / totalSections) * 100);
}

/**
 * Validate that all required sections are populated before marking as complete
 */
export async function validateDocumentationCompleteness(
  db: D1Database,
  projectId: string
): Promise<{ complete: boolean; missingSections: string[]; unresolvedUnknowns: string[] }> {
  try {
    // Fetch metadata
    const metadataResult = await db
      .prepare(`SELECT * FROM project_documentation_metadata WHERE project_id = ?`)
      .bind(projectId)
      .first<{
        completeness_percentage: number;
        required_unknowns_resolved: number;
        status: string;
      }>();

    if (!metadataResult) {
      return {
        complete: false,
        missingSections: ["All sections missing"],
        unresolvedUnknowns: [],
      };
    }

    // Check which sections are missing
    const docsResult = await db
      .prepare(
        `SELECT DISTINCT section_id FROM project_documentation WHERE project_id = ? AND section_id != 'overview'`
      )
      .bind(projectId)
      .all<{ section_id: string }>();

    const populatedSections = new Set((docsResult.results ?? []).map((r) => r.section_id));
    const allSections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
    const missingSections = allSections.filter((s) => !populatedSections.has(s));

    // Check unknowns
    const unknownsResult = await db
      .prepare(
        `SELECT content FROM project_documentation WHERE project_id = ? AND section_id = 'A' AND subsection_key = 'A1_unknowns'`
      )
      .bind(projectId)
      .first<{ content: string }>();

    const unresolvedUnknowns: string[] = [];
    if (unknownsResult) {
      try {
        const unknowns = JSON.parse(unknownsResult.content) as Record<string, string>;
        for (const [key, value] of Object.entries(unknowns)) {
          if (value === "UNKNOWN") {
            unresolvedUnknowns.push(key);
          }
        }
      } catch (e) {
        console.error("Failed to parse unknowns:", e);
      }
    }

    const complete = metadataResult.completeness_percentage >= 90 && metadataResult.required_unknowns_resolved >= 5;

    return {
      complete,
      missingSections,
      unresolvedUnknowns,
    };
  } catch (error) {
    console.error("Failed to validate documentation completeness:", error);
    return {
      complete: false,
      missingSections: ["Validation failed"],
      unresolvedUnknowns: [],
    };
  }
}

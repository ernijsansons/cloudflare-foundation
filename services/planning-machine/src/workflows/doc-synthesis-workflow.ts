/**
 * Documentation Synthesis Workflow
 *
 * Runs after Phase 15 (Synthesis) to validate and synthesize complete documentation
 * for elite agentic software execution in 2026.
 *
 * Ensures all critical sections are populated for one-shot autonomous execution:
 * - A: Assumptions + constraints + unknowns resolved
 * - B: North Star + success metrics
 * - C: Master checklist with DoD
 * - D: Architecture + tech stack
 * - E-F: Frontend/Backend specs
 * - G: Pricing + unit economics
 * - H-I: GTM + Brand
 * - J: Security + compliance
 * - K: Testing + observability
 * - L: Operations playbook
 * - M: Execution roadmap
 */

import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import { generateOverviewSection, validateDocumentationCompleteness } from "../lib/doc-populator";
import type { Env } from "../types";

export interface DocSynthesisParams {
	projectId: string;
	projectName: string;
}

export interface DocSynthesisResult {
	success: boolean;
	completeness: number;
	missingSections: string[];
	unresolvedUnknowns: string[];
	readyForExecution: boolean;
	qualityScore: number;
	blockers: string[];
	recommendations: string[];
}

export class DocSynthesisWorkflow extends WorkflowEntrypoint<Env, DocSynthesisParams> {
	async run(event: WorkflowEvent<DocSynthesisParams>, step: WorkflowStep) {
		const { projectId, projectName } = event.payload;

		// Step 1: Validate documentation completeness
		const validation = await step.do("validate-completeness", async () => {
			return await validateDocumentationCompleteness(this.env.DB, projectId);
		});

		// Step 2: Fetch all documentation sections
		const allSections = (await step.do("fetch-all-sections", async () => {
			const docsResult = await this.env.DB.prepare(
				`SELECT section_id, subsection_key, content, status, populated_by
         FROM project_documentation
         WHERE project_id = ?
         ORDER BY section_id, subsection_key`
			)
				.bind(projectId)
				.all();

			const sections: Record<string, unknown> = {};
			for (const row of docsResult.results as Array<{
				section_id: string;
				subsection_key: string | null;
				content: string;
			}>) {
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
					console.error(`Failed to parse section ${row.section_id}:`, e);
				}
			}
			return sections as any;
		})) as Record<string, any>;

		// Step 3: Validate critical sections for agentic execution
		const agenticReadiness = await step.do("validate-agentic-readiness", async () => {
			const blockers: string[] = [];
			const recommendations: string[] = [];

			// Critical Section A: Assumptions + Unknowns
			const sectionA = allSections.A as
				| {
						A0_intake?: {
							concept?: { core_directive?: string };
							agentic_execution?: { allowed_actions?: string[]; forbidden_actions?: string[] };
						};
						A1_unknowns?: Record<string, string>;
				  }
				| undefined;

			if (!sectionA?.A0_intake?.concept?.core_directive) {
				blockers.push("Section A: Core directive not defined");
			}
			if (!sectionA?.A0_intake?.agentic_execution?.allowed_actions?.length) {
				blockers.push("Section A: Allowed actions not defined");
			}
			if (!sectionA?.A0_intake?.agentic_execution?.forbidden_actions?.length) {
				blockers.push("Section A: Forbidden actions not defined");
			}

			// Check unknowns resolution
			if (sectionA?.A1_unknowns) {
				const unresolvedUnknowns = Object.entries(sectionA.A1_unknowns)
					.filter(([_, value]) => value === "UNKNOWN")
					.map(([key, _]) => key);
				if (unresolvedUnknowns.length > 0) {
					blockers.push(`Section A: Unresolved unknowns: ${unresolvedUnknowns.join(", ")}`);
				}
			}

			// Critical Section C: Master Checklist
			if (!allSections.C) {
				blockers.push("Section C: Master checklist missing");
			} else {
				const checklistTasks = Object.values(allSections.C as Record<string, unknown[]>).flat();
				if (checklistTasks.length === 0) {
					blockers.push("Section C: No checklist tasks defined");
				}
				recommendations.push(`Master checklist has ${checklistTasks.length} tasks`);
			}

			// Critical Section D: Architecture
			if (!allSections.D) {
				blockers.push("Section D: Architecture not defined");
			} else {
				recommendations.push("Architecture section populated");
			}

			// Critical Section J: Security
			if (!allSections.J) {
				blockers.push("Section J: Security controls missing - CRITICAL for production");
			} else {
				recommendations.push("Security section populated");
			}

			// Critical Section K: Testing + Observability
			if (!allSections.K) {
				blockers.push("Section K: Testing strategy missing - Required for verification");
			} else {
				recommendations.push("Testing strategy defined");
			}

			// Critical Section L: Operations Playbook
			if (!allSections.L) {
				blockers.push("Section L: Operations playbook missing - Required for maintenance");
			} else {
				recommendations.push("Operations playbook defined");
			}

			// Critical Section M: Roadmap
			if (!allSections.M) {
				blockers.push("Section M: Execution roadmap missing");
			} else {
				recommendations.push("Execution roadmap defined");
			}

			return { blockers, recommendations };
		});

		// Step 4: Calculate quality score (0-100)
		const qualityScore = await step.do("calculate-quality-score", async () => {
			let score = 0;

			// Completeness: 30 points
			score += Math.floor((validation.complete ? 30 : 0) * (allSections ? Object.keys(allSections).length / 13 : 0));

			// Unknowns resolved: 20 points
			if (validation.unresolvedUnknowns.length === 0) {
				score += 20;
			}

			// Critical sections present: 50 points (5 critical sections × 10 points each)
			const criticalSections = ["A", "C", "D", "J", "K"];
			for (const section of criticalSections) {
				if (allSections[section]) {
					score += 10;
				}
			}

			return Math.min(100, score);
		});

		// Step 5: Generate/update Overview section
		await step.do("generate-overview", async () => {
			const result = await generateOverviewSection(this.env.DB, projectId);
			if (!result.success) {
				throw new Error(result.error ?? "Failed to generate overview section");
			}
			return { updated: result.sectionsUpdated > 0 };
		});

		// Step 6: Update metadata
		await step.do("update-metadata", async () => {
			const completenessPercentage = Math.floor(
				((13 - validation.missingSections.length) / 13) * 100
			);
			const status =
				agenticReadiness.blockers.length === 0 && validation.complete ? "complete" : "incomplete";

			await this.env.DB.prepare(
				`INSERT INTO project_documentation_metadata (project_id, completeness_percentage, total_sections, populated_sections, required_unknowns_resolved, status, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(project_id)
         DO UPDATE SET
           completeness_percentage = ?,
           populated_sections = ?,
           required_unknowns_resolved = ?,
           status = ?,
           last_updated = ?`
			)
				.bind(
					projectId,
					completenessPercentage,
					13,
					13 - validation.missingSections.length,
					5 - validation.unresolvedUnknowns.length,
					status,
					Math.floor(Date.now() / 1000),
					// ON CONFLICT updates
					completenessPercentage,
					13 - validation.missingSections.length,
					5 - validation.unresolvedUnknowns.length,
					status,
					Math.floor(Date.now() / 1000)
				)
				.run();

			return { status, completenessPercentage };
		});

		// Step 7: Generate synthesis report
		const synthesisReport = await step.do("generate-synthesis-report", async () => {
			const report = {
				project_id: projectId,
				project_name: projectName,
				timestamp: new Date().toISOString(),
				completeness: Math.floor(((13 - validation.missingSections.length) / 13) * 100),
				quality_score: qualityScore,
				ready_for_execution: agenticReadiness.blockers.length === 0 && validation.complete,
				sections_populated: 13 - validation.missingSections.length,
				missing_sections: validation.missingSections,
				unresolved_unknowns: validation.unresolvedUnknowns,
				blockers: agenticReadiness.blockers,
				recommendations: agenticReadiness.recommendations,
				agentic_readiness: {
					core_directive_defined: !agenticReadiness.blockers.some((b) =>
						b.includes("core_directive")
					),
					allowed_actions_defined: !agenticReadiness.blockers.some((b) =>
						b.includes("allowed_actions")
					),
					forbidden_actions_defined: !agenticReadiness.blockers.some((b) =>
						b.includes("forbidden_actions")
					),
					security_controls_present: !agenticReadiness.blockers.some((b) => b.includes("Section J")),
					testing_strategy_defined: !agenticReadiness.blockers.some((b) => b.includes("Section K")),
					operations_playbook_present: !agenticReadiness.blockers.some((b) =>
						b.includes("Section L")
					),
					master_checklist_complete: !agenticReadiness.blockers.some((b) => b.includes("Section C")),
					unknowns_resolved: validation.unresolvedUnknowns.length === 0,
				},
				next_steps:
					agenticReadiness.blockers.length > 0
						? [
								"Resolve blockers listed above",
								"Complete missing sections",
								"Resolve all unknowns",
								"Re-run synthesis workflow",
						  ]
						: [
								"Documentation is complete and ready for agentic execution",
								"Review Overview section for final approval",
								"Assign to Naomi for one-shot implementation",
						  ],
			};

			// Save synthesis report as artifact
			const artifactId = crypto.randomUUID();
			await this.env.DB.prepare(
				`INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					artifactId,
					projectId,
					"doc-synthesis",
					1,
					JSON.stringify(report, null, 2),
					report.ready_for_execution ? "READY" : "BLOCKED",
					1,
					qualityScore,
					Math.floor(Date.now() / 1000)
				)
				.run();

			return report;
		});

		return {
			success: true,
			completeness: synthesisReport.completeness,
			missingSections: synthesisReport.missing_sections,
			unresolvedUnknowns: synthesisReport.unresolved_unknowns,
			readyForExecution: synthesisReport.ready_for_execution,
			qualityScore: synthesisReport.quality_score,
			blockers: synthesisReport.blockers,
			recommendations: synthesisReport.recommendations,
		};
	}
}

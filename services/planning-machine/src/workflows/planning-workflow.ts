/**
 * Planning Workflow — 14-phase durable pipeline
 */

/* global crypto, Queue */

import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';

import {
	PHASE_ORDER,
	getAgentForPhase,
	getPostPipelineAgent,
	type PhaseName
} from '../agents/registry';
import { populateDocumentation, generateOverviewSection } from '../lib/doc-populator';
import type { OrchestrationResult } from '../lib/orchestrator';
import { scoreArtifact, type QualityScore } from '../lib/quality-scorer';
import { embedAndStore, getContextForPhase } from '../lib/rag';
import { reviewArtifact, tiebreakerReview } from '../lib/reviewer';
import { validatePhaseOutput } from '../lib/schema-validator';
import type { Env } from '../types';

/** Emit webhook event for external reporting (e.g., to erlvinc.com) */
async function emitWebhookEvent(
	queue: Queue | undefined,
	event: {
		type: string;
		runId: string;
		phase?: string;
		status?: string;
		verdict?: string;
		score?: number | null;
		pivotCount?: number;
		timestamp: number;
	}
): Promise<void> {
	if (!queue) return;
	try {
		await queue.send(event);
	} catch (e) {
		// Never fail the workflow because of webhook
		console.warn('Webhook emit failed:', e);
	}
}

function extractCitationsFromArtifact(artifact: unknown): Array<{
	passage: string;
	confidence: number;
	sourceArtifactId?: string;
}> {
	if (!artifact || typeof artifact !== 'object') {
		return [];
	}

	const record = artifact as Record<string, unknown>;
	const directCitations = Array.isArray(record.citations) ? record.citations : [];
	if (directCitations.length > 0) {
		return directCitations
			.filter(
				(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
			)
			.map((entry) => ({
				passage: String(entry.claim ?? entry.snippet ?? ''),
				confidence:
					entry.confidence === 'high'
						? 0.95
						: entry.confidence === 'low'
							? 0.6
							: typeof entry.confidence === 'number'
								? entry.confidence
								: 0.8,
				sourceArtifactId: typeof entry.url === 'string' ? entry.url : undefined
			}))
			.filter((citation) => citation.passage.length > 0);
	}

	const refinedOpportunities = Array.isArray(record.refinedOpportunities)
		? record.refinedOpportunities
		: [];

	return refinedOpportunities
		.flatMap((variant) => {
			if (!variant || typeof variant !== 'object') {
				return [];
			}
			const sources = (variant as Record<string, unknown>).sources;
			return Array.isArray(sources) ? sources : [];
		})
		.filter(
			(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
		)
		.map((entry) => ({
			passage: String(entry.claim ?? entry.snippet ?? ''),
			confidence: 0.75,
			sourceArtifactId: typeof entry.url === 'string' ? entry.url : undefined
		}))
		.filter((citation) => citation.passage.length > 0);
}

function toQualityOrchestration(
	orchestration: OrchestrationResult | undefined
):
	| {
			consensusScore: number;
			modelCount: number;
			wildIdeas: Array<{ model: string; wildIdea: string }>;
	  }
	| undefined {
	if (!orchestration) {
		return undefined;
	}

	const successfulModels = orchestration.modelOutputs.filter((output) => output.text.length > 0);
	const modelCount = successfulModels.length;
	const wildIdeaPenalty = modelCount > 0 ? orchestration.wildIdeas.length / modelCount : 0;
	const consensusScore = Math.max(0.5, 1 - wildIdeaPenalty * 0.4);

	return {
		consensusScore,
		modelCount,
		wildIdeas: orchestration.wildIdeas.map((idea) => ({
			model: idea.model,
			wildIdea: idea.wildIdea
		}))
	};
}

function evaluateArtifactQuality(
	phase: PhaseName,
	artifact: unknown,
	orchestration?: OrchestrationResult
): QualityScore {
	return scoreArtifact({
		phase,
		artifact,
		orchestration: toQualityOrchestration(orchestration),
		citations: extractCitationsFromArtifact(artifact)
	});
}

export type PlanningParams = {
	runId: string;
	idea: string;
	refinedIdea?: string;
	config?: { requireApproval?: boolean; requireReview?: boolean; generateBuildSpec?: boolean };
};

export class PlanningWorkflow extends WorkflowEntrypoint<Env, PlanningParams> {
	async run(event: WorkflowEvent<PlanningParams>, step: WorkflowStep) {
		const { runId, idea, config } = event.payload;
		const requireReview = config?.requireReview ?? false;
		let refinedIdea = event.payload.refinedIdea ?? idea;
		const priorOutputs: Record<string, unknown> = {};
		let _killVerdict: string | null = null;
		// Stores orchestration results keyed by phase — populated by runPhase when a model council ran
		const orchestrationDataByPhase = new Map<string, OrchestrationResult>();
		const qualityScoreByPhase = new Map<string, number>();

		// Load pivotCount from DB for workflow resumption support
		let pivotCount = await step.do('load-pivot-count', async () => {
			const row = await this.env.DB.prepare('SELECT pivot_count FROM planning_runs WHERE id = ?')
				.bind(runId)
				.first();
			return ((row as Record<string, unknown>)?.pivot_count as number) ?? 0;
		});

		// Emit run_started webhook (must be in step)
		await step.do('emit-run-started-webhook', async () => {
			await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
				type: 'run_started',
				runId,
				status: 'running',
				timestamp: Math.floor(Date.now() / 1000)
			});
			return { emitted: true };
		});

		// ── Phase 0: Intake Agent ──────────────────────────────────────────────────
		// Captures comprehensive A0-A7 intake form before planning phases begin
		const intakeOutput = await step.do('phase-0-intake', async () => {
			const { IntakeAgent } = await import('../agents/intake-agent');
			const agent = new IntakeAgent(this.env);
			const result = await agent.run(
				{ runId, idea, refinedIdea, priorOutputs },
				{ idea, mode: 'auto' }
			);

			if (!result.success || !result.output) {
				throw new Error(`Phase 0 (Intake) failed: ${result.errors?.join(', ')}`);
			}

			const intakeValidation = validatePhaseOutput('phase-0-intake', result.output);
			if (!intakeValidation.valid) {
				throw new Error(
					`Phase 0 (Intake) schema validation failed: ${intakeValidation.errors?.join('; ')}`
				);
			}

			// Intake must block progression if critical unknowns are unresolved.
			if (!result.output.ready_to_proceed) {
				throw new Error(
					`Phase 0 (Intake) is not ready_to_proceed. Blockers: ${result.output.blockers.join('; ')}`
				);
			}

			// Save intake to database
			const artifactId = crypto.randomUUID();
			const contentStr = JSON.stringify(intakeValidation.data);
			const intakeQuality = scoreArtifact({
				phase: 'phase-0-intake',
				artifact: intakeValidation.data,
				citations: []
			});

			await this.env.DB.prepare(
				`INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					artifactId,
					runId,
					'phase-0-intake',
					1,
					contentStr,
					'ACCEPTED',
					1,
					intakeQuality.overall,
					Math.floor(Date.now() / 1000)
				)
				.run();

			// Populate Section A documentation
			await populateDocumentation({
				db: this.env.DB,
				projectId: runId,
				phase: 'phase-0-intake',
				phaseOutput: result.output
			});

			return result.output;
		});

		priorOutputs['__intake__'] = intakeOutput;
		priorOutputs['phase-0-intake'] = intakeOutput;
		// ── End Phase 0 ────────────────────────────────────────────────────────────

		const runPhase = async (phaseName: PhaseName, reviewerFeedback?: string): Promise<unknown> => {
			let ragContext: string | undefined;
			if (this.env.VECTOR_INDEX && this.env.AI && Object.keys(priorOutputs).length > 0) {
				ragContext = await getContextForPhase(
					this.env.AI,
					this.env.VECTOR_INDEX,
					runId,
					phaseName,
					priorOutputs
				);
			}

			const agent = getAgentForPhase(phaseName, this.env);
			const result = await agent.run(
				{
					runId,
					idea,
					refinedIdea,
					priorOutputs,
					ragContext,
					reviewerFeedback
				},
				{ idea, refinedIdea }
			);

			if (!result.success) {
				throw new Error(`Phase ${phaseName} failed: ${result.errors?.join(', ')}`);
			}

			const validation = validatePhaseOutput(phaseName, result.output);
			if (!validation.valid) {
				throw new Error(
					`Phase ${phaseName} schema validation failed: ${validation.errors?.join('; ')}`
				);
			}
			const validatedOutput = validation.data;

			// Capture orchestration data (per-model outputs + wild ideas) for DB persistence
			if (result.orchestration) {
				orchestrationDataByPhase.set(phaseName, result.orchestration);
			}

			priorOutputs[phaseName] = validatedOutput;

			if (
				phaseName === 'kill-test' &&
				validatedOutput &&
				typeof validatedOutput === 'object' &&
				'verdict' in validatedOutput
			) {
				_killVerdict = String((validatedOutput as { verdict: string }).verdict);
			}

			if (
				phaseName === 'opportunity' &&
				validatedOutput &&
				typeof validatedOutput === 'object' &&
				'refinedOpportunities' in validatedOutput
			) {
				const opp = validatedOutput as {
					refinedOpportunities?: Array<{ idea: string }>;
					recommendedIndex?: number;
				};
				const idx = opp.recommendedIndex ?? 0;
				const chosen = opp.refinedOpportunities?.[idx];
				if (chosen?.idea) {
					refinedIdea = chosen.idea;
					// Persist refined_idea to database
					await this.env.DB.prepare(
						'UPDATE planning_runs SET refined_idea = ?, updated_at = ? WHERE id = ?'
					)
						.bind(refinedIdea, Math.floor(Date.now() / 1000), runId)
						.run();
				}
			}

			return validatedOutput;
		};

		for (let i = 0; i < PHASE_ORDER.length; i++) {
			const phase = PHASE_ORDER[i]!;

			if (phase === 'kill-test') {
				// Use versioned step key to ensure fresh execution after PIVOT
				const killTestStepKey = pivotCount > 0 ? `phase-${phase}-v${pivotCount}` : `phase-${phase}`;
				const rawOutput = await step.do(killTestStepKey, async () => runPhase(phase) as object);
				const validation = validatePhaseOutput(phase, rawOutput);
				if (!validation.valid) {
					throw new Error(
						`Phase ${phase} schema validation failed: ${validation.errors?.join('; ')}`
					);
				}

				const orchData = orchestrationDataByPhase.get(phase);
				const killTestQuality = evaluateArtifactQuality(phase, validation.data, orchData);
				qualityScoreByPhase.set(phase, killTestQuality.overall);
				if (killTestQuality.overall < 55) {
					throw new Error(
						`Phase ${phase} quality score ${killTestQuality.overall} is below minimum threshold (55).`
					);
				}

				const output = validation.data as {
					verdict?: string;
					parkedForFuture?: { reason: string; revisitEstimateMonths: number; note?: string };
				};

				if (output?.verdict === 'KILL') {
					await step.do('save-kill', async () => {
						await this.env.DB.prepare(
							'UPDATE planning_runs SET status = ?, kill_verdict = ?, current_phase = ?, updated_at = ? WHERE id = ?'
						)
							.bind('killed', 'KILL', phase, Math.floor(Date.now() / 1000), runId)
							.run();

						if (output.parkedForFuture) {
							const parkedId = crypto.randomUUID();
							const artifactSummary =
								Object.keys(priorOutputs).length > 0
									? JSON.stringify(
											Object.fromEntries(
												Object.entries(priorOutputs).map(([k, v]) => [
													k,
													typeof v === 'object' ? JSON.stringify(v).slice(0, 500) : String(v)
												])
											)
										)
									: null;
							await this.env.DB.prepare(
								`INSERT INTO planning_parked_ideas (id, idea, refined_idea, run_id, source_phase, reason, revisit_estimate_months, revisit_estimate_note, artifact_summary, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
							)
								.bind(
									parkedId,
									idea,
									refinedIdea,
									runId,
									'kill-test',
									output.parkedForFuture.reason,
									output.parkedForFuture.revisitEstimateMonths,
									output.parkedForFuture.note ?? null,
									artifactSummary,
									Math.floor(Date.now() / 1000)
								)
								.run();
						}

						// Emit run_killed webhook
						await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
							type: 'run_killed',
							runId,
							phase: 'kill-test',
							status: 'killed',
							verdict: 'KILL',
							timestamp: Math.floor(Date.now() / 1000)
						});

						return { done: true, verdict: 'KILL' };
					});
					return { verdict: 'KILL', runId };
				}

				if (output?.verdict === 'PIVOT' && pivotCount < 3) {
					pivotCount++;

					// Persist pivot count to database for workflow resumption
					await step.do(`persist-pivot-${pivotCount}`, async () => {
						await this.env.DB.prepare(
							'UPDATE planning_runs SET pivot_count = ?, updated_at = ? WHERE id = ?'
						)
							.bind(pivotCount, Math.floor(Date.now() / 1000), runId)
							.run();
						return { pivotCount };
					});

					// Emit pivot_triggered webhook (must be in step)
					await step.do(`emit-pivot-webhook-${pivotCount}`, async () => {
						await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
							type: 'pivot_triggered',
							runId,
							phase: 'kill-test',
							status: 'running',
							verdict: 'PIVOT',
							pivotCount,
							timestamp: Math.floor(Date.now() / 1000)
						});
						return { emitted: true };
					});

					priorOutputs.opportunity = undefined;
					priorOutputs['customer-intel'] = undefined;
					priorOutputs['market-research'] = undefined;
					priorOutputs['competitive-intel'] = undefined;
					priorOutputs['kill-test'] = undefined;
					i = -1;
					continue;
				}

				// Handle PIVOT exhausted - when 3 pivots have been used and another PIVOT is requested
				if (output?.verdict === 'PIVOT' && pivotCount >= 3) {
					await step.do('save-pivot-exhausted', async () => {
						await this.env.DB.prepare(
							'UPDATE planning_runs SET status = ?, kill_verdict = ?, current_phase = ?, updated_at = ? WHERE id = ?'
						)
							.bind('killed', 'PIVOT_EXHAUSTED', phase, Math.floor(Date.now() / 1000), runId)
							.run();

						// Park the idea for future revisit
						const parkedId = crypto.randomUUID();
						const artifactSummary =
							Object.keys(priorOutputs).length > 0
								? JSON.stringify(
										Object.fromEntries(
											Object.entries(priorOutputs).map(([k, v]) => [
												k,
												typeof v === 'object' ? JSON.stringify(v).slice(0, 500) : String(v)
											])
										)
									)
								: null;

						await this.env.DB.prepare(
							`INSERT INTO planning_parked_ideas (id, idea, refined_idea, run_id, source_phase, reason, revisit_estimate_months, revisit_estimate_note, artifact_summary, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
						)
							.bind(
								parkedId,
								idea,
								refinedIdea,
								runId,
								'kill-test',
								'Idea required 3+ pivots without finding viable direction',
								6,
								'Revisit when market conditions or strategy fundamentally change',
								artifactSummary,
								Math.floor(Date.now() / 1000)
							)
							.run();

						// Emit run_killed webhook for pivot exhausted
						await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
							type: 'run_killed',
							runId,
							phase: 'kill-test',
							status: 'killed',
							verdict: 'PIVOT_EXHAUSTED',
							pivotCount,
							timestamp: Math.floor(Date.now() / 1000)
						});

						return { done: true, verdict: 'PIVOT_EXHAUSTED', pivotCount };
					});

					return { verdict: 'PIVOT_EXHAUSTED', runId, pivotCount };
				}

				// Kill-test phase complete with GO verdict - save artifact and continue
				await step.do('save-kill-test-artifact', async () => {
					const artifactId = crypto.randomUUID();
					const contentStr = JSON.stringify(output);

					await this.env.DB.prepare(
						'UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?'
					)
						.bind(phase, Math.floor(Date.now() / 1000), runId)
						.run();

					await this.env.DB.prepare(
						`INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
						.bind(
							artifactId,
							runId,
							phase,
							pivotCount + 1,
							contentStr,
							'GO',
							1,
							killTestQuality.overall,
							Math.floor(Date.now() / 1000)
						)
						.run();

					const orchData = orchestrationDataByPhase.get(phase);
					if (orchData) {
						await this.env.DB.prepare(
							'UPDATE planning_artifacts SET model_outputs = ?, wild_ideas = ? WHERE id = ?'
						)
							.bind(
								JSON.stringify(orchData.modelOutputs),
								JSON.stringify(orchData.wildIdeas),
								artifactId
							)
							.run();
						orchestrationDataByPhase.delete(phase);
					}

					if (this.env.VECTOR_INDEX && this.env.AI) {
						await embedAndStore(this.env.AI, this.env.VECTOR_INDEX, this.env.DB, {
							id: artifactId,
							runId,
							phase,
							content: contentStr
						});
					}

					return { saved: true };
				});

				// Emit phase_completed webhook for kill-test GO (must be in step)
				await step.do(`emit-kill-test-webhook-${pivotCount + 1}`, async () => {
					await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
						type: 'phase_completed',
						runId,
						phase,
						status: 'running',
						verdict: 'GO',
						score: killTestQuality.overall,
						timestamp: Math.floor(Date.now() / 1000)
					});
					return { emitted: true };
				});

				priorOutputs[phase] = output;

				// Populate documentation sections from kill-test output
				await step.do(`populate-docs-${phase}-${pivotCount + 1}`, async () => {
					return await populateDocumentation({
						db: this.env.DB,
						projectId: runId,
						phase,
						phaseOutput: output
					});
				});

				continue;
			}

			// Use versioned step keys for pre-kill-test phases after PIVOT to ensure fresh execution
			const preKillTestPhases = [
				'opportunity',
				'customer-intel',
				'market-research',
				'competitive-intel'
			];
			const stepKey =
				preKillTestPhases.includes(phase) && pivotCount > 0
					? `phase-${phase}-v${pivotCount}`
					: `phase-${phase}`;

			const phaseOutput = await step.do(stepKey, async (): Promise<object> => {
				const MAX_REVISION_ITERATIONS = 3;
				let currentIteration = 1;
				let output: unknown = await runPhase(phase);
				let validation = validatePhaseOutput(phase, output);
				if (!validation.valid) {
					throw new Error(
						`Phase ${phase} schema validation failed: ${validation.errors?.join('; ')}`
					);
				}
				output = validation.data;
				let contentStr = JSON.stringify(output);
				const artifactId = crypto.randomUUID();
				let reviewVerdict: string | null = null;
				let overallScore: number | null = null;

				// Review loop with REVISE support (kill-test already handled above with continue)
				if (requireReview && this.env.AI) {
					const agent = getAgentForPhase(phase, this.env);
					const phaseRubric = agent.getPhaseRubric();

					while (currentIteration <= MAX_REVISION_ITERATIONS) {
						const review = await reviewArtifact(
							this.env.AI,
							phase,
							contentStr,
							phaseRubric,
							currentIteration
						);

						reviewVerdict = review.verdict;
						overallScore = Object.values(review.scores).length
							? Object.values(review.scores).reduce((a, b) => a + b, 0) /
								Object.values(review.scores).length
							: null;

						if (review.verdict === 'ACCEPT') {
							break;
						}

						if (review.verdict === 'REJECT') {
							// Go straight to tiebreaker on REJECT
							const tiebreaker = await tiebreakerReview(
								this.env.AI,
								phase,
								contentStr,
								review.feedback
							);
							reviewVerdict = tiebreaker;
							if (tiebreaker === 'REJECT') {
								throw new Error(`Phase ${phase} rejected by reviewer: ${review.feedback}`);
							}
							break;
						}

						// verdict === "REVISE"
						if (currentIteration >= MAX_REVISION_ITERATIONS) {
							// Max iterations reached, use tiebreaker
							const tiebreaker = await tiebreakerReview(
								this.env.AI,
								phase,
								contentStr,
								review.feedback
							);
							reviewVerdict = tiebreaker;
							if (tiebreaker === 'REJECT') {
								throw new Error(
									`Phase ${phase} rejected after ${currentIteration} revisions: ${review.feedback}`
								);
							}
							break;
						}

						// Re-run agent with feedback for revision
						currentIteration++;
						output = await runPhase(phase, review.feedback);
						validation = validatePhaseOutput(phase, output);
						if (!validation.valid) {
							throw new Error(
								`Phase ${phase} schema validation failed after revision ${currentIteration}: ${validation.errors?.join('; ')}`
							);
						}
						output = validation.data;
						contentStr = JSON.stringify(output);
					}
				}

				const automatedQuality = evaluateArtifactQuality(
					phase,
					output,
					orchestrationDataByPhase.get(phase)
				);
				if (automatedQuality.overall < 55) {
					throw new Error(
						`Phase ${phase} quality score ${automatedQuality.overall} is below minimum threshold (55).`
					);
				}
				const finalQualityScore =
					overallScore === null
						? automatedQuality.overall
						: Math.round((overallScore + automatedQuality.overall) / 2);
				overallScore = finalQualityScore;
				qualityScoreByPhase.set(phase, finalQualityScore);

				await this.env.DB.prepare(
					'UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?'
				)
					.bind(phase, Math.floor(Date.now() / 1000), runId)
					.run();

				await this.env.DB.prepare(
					`INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
					.bind(
						artifactId,
						runId,
						phase,
						currentIteration,
						contentStr,
						reviewVerdict,
						currentIteration,
						overallScore,
						Math.floor(Date.now() / 1000)
					)
					.run();

				// Persist per-model outputs and wild ideas when orchestration was used
				const orchData = orchestrationDataByPhase.get(phase);
				if (orchData) {
					await this.env.DB.prepare(
						'UPDATE planning_artifacts SET model_outputs = ?, wild_ideas = ? WHERE id = ?'
					)
						.bind(
							JSON.stringify(orchData.modelOutputs),
							JSON.stringify(orchData.wildIdeas),
							artifactId
						)
						.run();

					if (orchData.wildIdeas.length > 0) {
						console.log(
							`[workflow] Wild ideas stored for phase ${phase}:`,
							JSON.stringify(orchData.wildIdeas, null, 2)
						);
					}
					orchestrationDataByPhase.delete(phase);
				}

				if (this.env.VECTOR_INDEX && this.env.AI) {
					await embedAndStore(this.env.AI, this.env.VECTOR_INDEX, this.env.DB, {
						id: artifactId,
						runId,
						phase,
						content: contentStr
					});
				}

				return output as object;
			});

			// Emit phase_completed webhook (must be in step)
			await step.do(`emit-${phase}-webhook`, async () => {
				await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
					type: 'phase_completed',
					runId,
					phase,
					status: 'running',
					score: qualityScoreByPhase.get(phase) ?? null,
					timestamp: Math.floor(Date.now() / 1000)
				});
				return { emitted: true };
			});

			priorOutputs[phase] = phaseOutput;

			// Populate documentation sections from phase output
			await step.do(`populate-docs-${phase}`, async () => {
				return await populateDocumentation({
					db: this.env.DB,
					projectId: runId,
					phase,
					phaseOutput
				});
			});
		}

		// ── Generate Overview Documentation ────────────────────────────────────────
		// After all planning phases complete, generate the Overview section
		await step.do('generate-overview-section', async () => {
			return await generateOverviewSection(this.env.DB, runId);
		});
		// ── End Overview Generation ────────────────────────────────────────────────

		// ── Phase 16: Task Reconciliation ──────────────────────────────────────────
		// Reads draft tasks from phases 9-14 (compact arrays, NOT full outputs).
		// Produces TASKS.json and saves it as both a planning_artifact and R2 object.
		const taskReconciliationOutput = await step.do(
			'phase-task-reconciliation',
			async (): Promise<object> => {
				// Extract only draft tasks from contributing phases (keeps context window small)
				const draftTasksByPhase: Record<string, unknown[]> = {};
				const draftPhases = [
					'product-design',
					'gtm-marketing',
					'content-engine',
					'tech-arch',
					'analytics',
					'launch-execution'
				];
				for (const draftPhase of draftPhases) {
					const phaseOutput = priorOutputs[draftPhase] as Record<string, unknown> | undefined;
					if (phaseOutput?.draftTasks && Array.isArray(phaseOutput.draftTasks)) {
						draftTasksByPhase[draftPhase] = phaseOutput.draftTasks;
					}
				}

				// Compact summaries for context bundle — just enough for naomiPrompt generation
				const techArchOutput = priorOutputs['tech-arch'] as Record<string, unknown> | undefined;
				const productDesignOutput = priorOutputs['product-design'] as
					| Record<string, unknown>
					| undefined;
				const techArchSummary = techArchOutput
					? `API Routes: ${JSON.stringify(techArchOutput.apiRoutes ?? []).slice(0, 800)}\nDB Schema: ${JSON.stringify(techArchOutput.databaseSchema ?? {}).slice(0, 800)}`
					: 'No tech arch output available';
				const productDesignSummary = productDesignOutput
					? `MVP Scope: ${JSON.stringify(productDesignOutput.mvpScope ?? {}).slice(0, 600)}`
					: 'No product design output available';

				const intake = priorOutputs['__intake__'] as Record<string, unknown> | undefined;
				const intakeConstraints = intake ?? {
					techStack: 'Cloudflare-native (Workers, D1, KV, R2, Queues, Durable Objects, SvelteKit)',
					teamSize: '1-2 engineers + AI agents',
					budgetRange: 'bootstrap',
					deploymentTarget: 'Cloudflare Pages + Workers',
					mustAvoid: []
				};

				const { TaskReconciliationAgent } = await import('../agents/task-reconciliation-agent');
				const agent = new TaskReconciliationAgent(this.env);
				const result = await agent.run(
					{ runId, idea, refinedIdea, priorOutputs },
					{
						draftTasksByPhase: draftTasksByPhase as unknown as Record<
							string,
							Array<{ title: string; [key: string]: unknown }>
						>,
						intakeConstraints,
						techArchSummary,
						productDesignSummary,
						namingConventions: {
							files: 'kebab-case',
							functions: 'camelCase',
							dbColumns: 'snake_case'
						}
					}
				);

				if (!result.success || !result.output) {
					console.error('[workflow] Task reconciliation failed:', result.errors);
					return {
						projectId: runId,
						projectName: idea,
						generatedAt: new Date().toISOString(),
						version: '1.0',
						summary: {
							totalTasks: 0,
							totalMarketingTasks: 0,
							byCategory: {},
							byPriority: {},
							criticalPath: [],
							buildPhaseCount: 8
						},
						intakeConstraints,
						buildPhases: [],
						tasks: [],
						marketingTasks: [],
						pipelineMemoryUsed: [],
						researchCitationCount: 0,
						reconciliation: {
							draftTasksReceived: 0,
							tasksMerged: 0,
							securityTasksAdded: 0,
							glueTasksAdded: 0,
							testTasksAdded: 0,
							infraTasksAdded: 0,
							dependencyCyclesFound: 0,
							cyclesResolved: [],
							contributingPhases: [],
							lessonsApplied: []
						}
					};
				}

				return result.output as object;
			}
		);

		const taskValidation = validatePhaseOutput('task-reconciliation', taskReconciliationOutput);
		if (!taskValidation.valid) {
			throw new Error(
				`Phase task-reconciliation schema validation failed: ${taskValidation.errors?.join('; ')}`
			);
		}
		const validatedTaskReconciliationOutput = taskValidation.data as object;
		const taskReconciliationQuality = scoreArtifact({
			phase: 'task-reconciliation',
			artifact: validatedTaskReconciliationOutput,
			citations: []
		});
		qualityScoreByPhase.set('task-reconciliation', taskReconciliationQuality.overall);

		// Save Phase 16 artifact + TASKS.json to R2
		await step.do('save-task-reconciliation-artifact', async () => {
			const artifactId = crypto.randomUUID();
			const contentStr = JSON.stringify(validatedTaskReconciliationOutput);

			await this.env.DB.prepare(
				'UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?'
			)
				.bind('task-reconciliation', Math.floor(Date.now() / 1000), runId)
				.run();

			await this.env.DB.prepare(
				`INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(
					artifactId,
					runId,
					'task-reconciliation',
					1,
					contentStr,
					'ACCEPTED',
					1,
					taskReconciliationQuality.overall,
					Math.floor(Date.now() / 1000)
				)
				.run();

			// Store TASKS.json to R2 for direct download by Naomi bridge
			if (this.env.FILES) {
				await this.env.FILES.put(`runs/${runId}/TASKS.json`, contentStr, {
					httpMetadata: { contentType: 'application/json' },
					customMetadata: { runId, phase: 'task-reconciliation', generatedAt: String(Date.now()) }
				});
			}

			return { saved: true, artifactId };
		});

		priorOutputs['task-reconciliation'] = validatedTaskReconciliationOutput;
		// ── End Phase 16 ───────────────────────────────────────────────────────────

		// ── Post-Pipeline: Architecture Advisor (Project Factory v3.0) ─────────────
		// Generate BuildSpec recommendation based on all artifacts.
		// Gated by config.generateBuildSpec (default: true). Failures don't fail the run.
		if (config?.generateBuildSpec !== false) {
			await step.do('architecture-advisor', async () => {
				try {
					const advisorAgent = getPostPipelineAgent('architecture-advisor', this.env);
					if (!advisorAgent) {
						console.warn('[workflow] Architecture Advisor agent not found, skipping');
						return { skipped: true, reason: 'agent_not_found' };
					}

					// Build context for the advisor agent
					const advisorContext = {
						runId,
						idea: refinedIdea,
						priorOutputs
					};

					// Run the agent with AgentContext and input
					const advisorResult = await advisorAgent.run(advisorContext, { idea: refinedIdea });

					if (!advisorResult.success || !advisorResult.output) {
						console.warn('[workflow] Architecture Advisor returned unsuccessful result');
						return { success: false, reason: 'agent_unsuccessful', errors: advisorResult.errors };
					}

					// Extract the BuildSpec output
					const buildSpec = advisorResult.output as Record<string, unknown>;

					// Persist BuildSpec to build_specs table
					const buildSpecId = crypto.randomUUID();
					const buildSpecJson = JSON.stringify(buildSpec);
					await this.env.DB.prepare(
						`INSERT OR REPLACE INTO build_specs
             (id, run_id, recommended, alternatives, data_model, api_routes, frontend, agents, free_wins, growth_path, scaffold_command, total_cost, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
					)
						.bind(
							buildSpecId,
							runId,
							JSON.stringify(buildSpec.recommended ?? null),
							JSON.stringify(buildSpec.alternatives ?? []),
							JSON.stringify(buildSpec.dataModel ?? null),
							JSON.stringify(buildSpec.apiRoutes ?? []),
							JSON.stringify(buildSpec.frontend ?? null),
							JSON.stringify(buildSpec.agents ?? []),
							JSON.stringify(buildSpec.freeWins ?? []),
							JSON.stringify(buildSpec.growthPath ?? null),
							(buildSpec.scaffoldCommand as string) ?? null,
							JSON.stringify(buildSpec.totalEstimatedMonthlyCost ?? null),
							Math.floor(Date.now() / 1000),
							Math.floor(Date.now() / 1000)
						)
						.run();

					// Store to R2 for direct download
					if (this.env.FILES) {
						await this.env.FILES.put(`runs/${runId}/build-spec.json`, buildSpecJson, {
							httpMetadata: { contentType: 'application/json' },
							customMetadata: {
								runId,
								phase: 'architecture-advisor',
								generatedAt: String(Date.now())
							}
						});
					}

					// Emit webhook event
					await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
						type: 'build_spec_generated',
						runId,
						status: 'success',
						timestamp: Math.floor(Date.now() / 1000)
					});

					return { success: true, buildSpecId };
				} catch (error) {
					// Log and continue — don't fail the entire run
					console.error('[workflow] Architecture Advisor failed:', error);
					await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
						type: 'build_spec_generated',
						runId,
						status: 'failed',
						timestamp: Math.floor(Date.now() / 1000)
					});
					return { success: false, error: String(error) };
				}
			});
		}
		// ── End Post-Pipeline ──────────────────────────────────────────────────────

		await step.do('complete', async () => {
			let packageKey: string | null = null;
			if (this.env.FILES && Object.keys(priorOutputs).length > 0) {
				const packageJson = JSON.stringify({
					runId,
					idea,
					refinedIdea,
					artifacts: priorOutputs,
					completedAt: new Date().toISOString()
				});
				packageKey = `runs/${runId}/planning-package.json`;
				await this.env.FILES.put(packageKey, packageJson, {
					httpMetadata: { contentType: 'application/json' },
					customMetadata: { runId, generatedAt: String(Date.now()) }
				});
			}

			const qualityValues = Array.from(qualityScoreByPhase.values());
			const aggregateQuality =
				qualityValues.length > 0
					? Math.round(
							qualityValues.reduce((total, score) => total + score, 0) / qualityValues.length
						)
					: null;

			await this.env.DB.prepare(
				'UPDATE planning_runs SET status = ?, package_key = ?, quality_score = ?, updated_at = ? WHERE id = ?'
			)
				.bind('completed', packageKey, aggregateQuality, Math.floor(Date.now() / 1000), runId)
				.run();

			// Emit run_completed webhook
			await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
				type: 'run_completed',
				runId,
				status: 'completed',
				timestamp: Math.floor(Date.now() / 1000)
			});

			return { done: true, runId, packageKey };
		});

		return { verdict: 'completed', runId };
	}
}

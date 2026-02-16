/**
 * Planning Workflow — 14-phase durable pipeline
 */

import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { Env } from "../types";
import { PHASE_ORDER, getAgentForPhase, type PhaseName } from "../agents/registry";
import { embedAndStore, getContextForPhase } from "../lib/rag";
import { reviewArtifact, tiebreakerReview } from "../lib/reviewer";

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
    console.warn("Webhook emit failed:", e);
  }
}

export type PlanningParams = {
  runId: string;
  idea: string;
  refinedIdea?: string;
  config?: { requireApproval?: boolean; requireReview?: boolean };
};

export class PlanningWorkflow extends WorkflowEntrypoint<Env, PlanningParams> {
  async run(event: WorkflowEvent<PlanningParams>, step: WorkflowStep) {
    const { runId, idea, config } = event.payload;
    const requireReview = config?.requireReview ?? false;
    let refinedIdea = event.payload.refinedIdea ?? idea;
    const priorOutputs: Record<string, unknown> = {};
    let killVerdict: string | null = null;

    // Load pivotCount from DB for workflow resumption support
    let pivotCount = await step.do("load-pivot-count", async () => {
      const row = await this.env.DB.prepare(
        "SELECT pivot_count FROM planning_runs WHERE id = ?"
      )
        .bind(runId)
        .first();
      return ((row as Record<string, unknown>)?.pivot_count as number) ?? 0;
    });

    // Emit run_started webhook
    await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
      type: "run_started",
      runId,
      status: "running",
      timestamp: Math.floor(Date.now() / 1000),
    });

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
          reviewerFeedback,
        },
        { idea, refinedIdea }
      );

      if (!result.success) {
        throw new Error(`Phase ${phaseName} failed: ${result.errors?.join(", ")}`);
      }

      priorOutputs[phaseName] = result.output;

      if (phaseName === "kill-test" && result.output && typeof result.output === "object" && "verdict" in result.output) {
        killVerdict = String((result.output as { verdict: string }).verdict);
      }

      if (phaseName === "opportunity" && result.output && typeof result.output === "object" && "refinedOpportunities" in result.output) {
        const opp = result.output as { refinedOpportunities?: Array<{ idea: string }>; recommendedIndex?: number };
        const idx = opp.recommendedIndex ?? 0;
        const chosen = opp.refinedOpportunities?.[idx];
        if (chosen?.idea) {
          refinedIdea = chosen.idea;
          // Persist refined_idea to database
          await this.env.DB.prepare(
            "UPDATE planning_runs SET refined_idea = ?, updated_at = ? WHERE id = ?"
          )
            .bind(refinedIdea, Math.floor(Date.now() / 1000), runId)
            .run();
        }
      }

      return result.output;
    };

    for (let i = 0; i < PHASE_ORDER.length; i++) {
      const phase = PHASE_ORDER[i]!;

      if (phase === "kill-test") {
        // Use versioned step key to ensure fresh execution after PIVOT
        const killTestStepKey = pivotCount > 0 ? `phase-${phase}-v${pivotCount}` : `phase-${phase}`;
        const output = await step.do(killTestStepKey, async () => runPhase(phase) as object) as { verdict?: string } | undefined;

        if (output?.verdict === "KILL") {
          await step.do("save-kill", async () => {
            await this.env.DB.prepare(
              "UPDATE planning_runs SET status = ?, kill_verdict = ?, current_phase = ?, updated_at = ? WHERE id = ?"
            )
              .bind("killed", "KILL", phase, Math.floor(Date.now() / 1000), runId)
              .run();

            const parked = output as { parkedForFuture?: { reason: string; revisitEstimateMonths: number; note?: string } };
            if (parked.parkedForFuture) {
              const parkedId = crypto.randomUUID();
              const artifactSummary = Object.keys(priorOutputs).length > 0
                ? JSON.stringify(
                    Object.fromEntries(
                      Object.entries(priorOutputs).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v).slice(0, 500) : String(v)])
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
                  "kill-test",
                  parked.parkedForFuture.reason,
                  parked.parkedForFuture.revisitEstimateMonths,
                  parked.parkedForFuture.note ?? null,
                  artifactSummary,
                  Math.floor(Date.now() / 1000)
                )
                .run();
            }

            // Emit run_killed webhook
            await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
              type: "run_killed",
              runId,
              phase: "kill-test",
              status: "killed",
              verdict: "KILL",
              timestamp: Math.floor(Date.now() / 1000),
            });

            return { done: true, verdict: "KILL" };
          });
          return { verdict: "KILL", runId };
        }

        if (output?.verdict === "PIVOT" && pivotCount < 3) {
          pivotCount++;

          // Persist pivot count to database for workflow resumption
          await step.do(`persist-pivot-${pivotCount}`, async () => {
            await this.env.DB.prepare(
              "UPDATE planning_runs SET pivot_count = ?, updated_at = ? WHERE id = ?"
            )
              .bind(pivotCount, Math.floor(Date.now() / 1000), runId)
              .run();
            return { pivotCount };
          });

          // Emit pivot_triggered webhook
          await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
            type: "pivot_triggered",
            runId,
            phase: "kill-test",
            status: "running",
            verdict: "PIVOT",
            pivotCount,
            timestamp: Math.floor(Date.now() / 1000),
          });

          priorOutputs.opportunity = undefined;
          priorOutputs["customer-intel"] = undefined;
          priorOutputs["market-research"] = undefined;
          priorOutputs["competitive-intel"] = undefined;
          priorOutputs["kill-test"] = undefined;
          i = -1;
          continue;
        }

        // Handle PIVOT exhausted - when 3 pivots have been used and another PIVOT is requested
        if (output?.verdict === "PIVOT" && pivotCount >= 3) {
          await step.do("save-pivot-exhausted", async () => {
            await this.env.DB.prepare(
              "UPDATE planning_runs SET status = ?, kill_verdict = ?, current_phase = ?, updated_at = ? WHERE id = ?"
            )
              .bind("killed", "PIVOT_EXHAUSTED", phase, Math.floor(Date.now() / 1000), runId)
              .run();

            // Park the idea for future revisit
            const parkedId = crypto.randomUUID();
            const artifactSummary = Object.keys(priorOutputs).length > 0
              ? JSON.stringify(
                  Object.fromEntries(
                    Object.entries(priorOutputs).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v).slice(0, 500) : String(v)])
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
                "kill-test",
                "Idea required 3+ pivots without finding viable direction",
                6,
                "Revisit when market conditions or strategy fundamentally change",
                artifactSummary,
                Math.floor(Date.now() / 1000)
              )
              .run();

            // Emit run_killed webhook for pivot exhausted
            await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
              type: "run_killed",
              runId,
              phase: "kill-test",
              status: "killed",
              verdict: "PIVOT_EXHAUSTED",
              pivotCount,
              timestamp: Math.floor(Date.now() / 1000),
            });

            return { done: true, verdict: "PIVOT_EXHAUSTED", pivotCount };
          });

          return { verdict: "PIVOT_EXHAUSTED", runId, pivotCount };
        }

        // Kill-test phase complete with GO verdict - save artifact and continue
        await step.do("save-kill-test-artifact", async () => {
          const artifactId = crypto.randomUUID();
          const contentStr = JSON.stringify(output);

          await this.env.DB.prepare(
            "UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?"
          )
            .bind(phase, Math.floor(Date.now() / 1000), runId)
            .run();

          await this.env.DB.prepare(
            `INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(artifactId, runId, phase, pivotCount + 1, contentStr, "GO", 1, null, Math.floor(Date.now() / 1000))
            .run();

          if (this.env.VECTOR_INDEX && this.env.AI) {
            await embedAndStore(
              this.env.AI,
              this.env.VECTOR_INDEX,
              this.env.DB,
              { id: artifactId, runId, phase, content: contentStr }
            );
          }

          return { saved: true };
        });

        // Emit phase_completed webhook for kill-test GO
        await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
          type: "phase_completed",
          runId,
          phase,
          status: "running",
          verdict: "GO",
          timestamp: Math.floor(Date.now() / 1000),
        });

        priorOutputs[phase] = output;
        continue;
      }

      // Use versioned step keys for pre-kill-test phases after PIVOT to ensure fresh execution
      const preKillTestPhases = ["opportunity", "customer-intel", "market-research", "competitive-intel"];
      const stepKey = preKillTestPhases.includes(phase) && pivotCount > 0
        ? `phase-${phase}-v${pivotCount}`
        : `phase-${phase}`;

      const phaseOutput = await step.do(stepKey, async (): Promise<object> => {
        const MAX_REVISION_ITERATIONS = 3;
        let currentIteration = 1;
        let output: unknown = await runPhase(phase);
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
              ? Object.values(review.scores).reduce((a, b) => a + b, 0) / Object.values(review.scores).length
              : null;

            if (review.verdict === "ACCEPT") {
              break;
            }

            if (review.verdict === "REJECT") {
              // Go straight to tiebreaker on REJECT
              const tiebreaker = await tiebreakerReview(
                this.env.AI,
                phase,
                contentStr,
                review.feedback
              );
              reviewVerdict = tiebreaker;
              if (tiebreaker === "REJECT") {
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
              if (tiebreaker === "REJECT") {
                throw new Error(`Phase ${phase} rejected after ${currentIteration} revisions: ${review.feedback}`);
              }
              break;
            }

            // Re-run agent with feedback for revision
            currentIteration++;
            output = await runPhase(phase, review.feedback);
            contentStr = JSON.stringify(output);
          }
        }

        await this.env.DB.prepare(
          "UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?"
        )
          .bind(phase, Math.floor(Date.now() / 1000), runId)
          .run();

        await this.env.DB.prepare(
          `INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, review_iterations, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(artifactId, runId, phase, currentIteration, contentStr, reviewVerdict, currentIteration, overallScore, Math.floor(Date.now() / 1000))
          .run();

        if (this.env.VECTOR_INDEX && this.env.AI) {
          await embedAndStore(
            this.env.AI,
            this.env.VECTOR_INDEX,
            this.env.DB,
            { id: artifactId, runId, phase, content: contentStr }
          );
        }

        return output as object;
      });

      // Emit phase_completed webhook
      await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
        type: "phase_completed",
        runId,
        phase,
        status: "running",
        score: null,
        timestamp: Math.floor(Date.now() / 1000),
      });

      priorOutputs[phase] = phaseOutput;
    }

    await step.do("complete", async () => {
      let packageKey: string | null = null;
      if (this.env.FILES && Object.keys(priorOutputs).length > 0) {
        const packageJson = JSON.stringify({
          runId,
          idea,
          refinedIdea,
          artifacts: priorOutputs,
          completedAt: new Date().toISOString(),
        });
        packageKey = `runs/${runId}/planning-package.json`;
        await this.env.FILES.put(packageKey, packageJson, {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { runId, generatedAt: String(Date.now()) },
        });
      }

      await this.env.DB.prepare(
        "UPDATE planning_runs SET status = ?, package_key = ?, updated_at = ? WHERE id = ?"
      )
        .bind("completed", packageKey, Math.floor(Date.now() / 1000), runId)
        .run();

      // Emit run_completed webhook
      await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
        type: "run_completed",
        runId,
        status: "completed",
        timestamp: Math.floor(Date.now() / 1000),
      });

      return { done: true, runId, packageKey };
    });

    return { verdict: "completed", runId };
  }
}

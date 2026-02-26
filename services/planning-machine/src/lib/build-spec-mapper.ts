/**
 * BuildSpec Mapper — Transform Architecture Advisor output to BuildSpec
 *
 * Project Factory v3.0
 */

/* global crypto */

import type { BuildSpec } from '@foundation/shared';

import type { ArchitectureAdvisorOutput } from '../schemas/architecture-advisor';

/**
 * Transform Architecture Advisor output into a complete BuildSpec
 * by adding persistence metadata (id, runId, status, timestamps)
 *
 * @param agentOutput - Raw output from Architecture Advisor agent
 * @param runId - Planning run ID
 * @returns Complete BuildSpec ready for D1 persistence
 */
export function mapToBuildSpec(agentOutput: ArchitectureAdvisorOutput, runId: string): BuildSpec {
	const now = new Date().toISOString();

	return {
		// Add persistence metadata
		id: crypto.randomUUID(),
		runId,
		status: 'draft',
		createdAt: now,
		updatedAt: now,

		// Pass through agent output fields
		recommended: agentOutput.recommended,
		alternatives: agentOutput.alternatives,
		dataModel: agentOutput.dataModel,
		apiRoutes: agentOutput.apiRoutes,
		frontend: agentOutput.frontend,
		agents: agentOutput.agents,
		freeWins: agentOutput.freeWins,
		growthPath: agentOutput.growthPath,
		scaffoldCommand: agentOutput.scaffoldCommand,
		totalEstimatedMonthlyCost: agentOutput.totalEstimatedMonthlyCost
	};
}

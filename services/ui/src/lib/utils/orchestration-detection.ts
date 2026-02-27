/**
 * Orchestration Detection Utility
 *
 * Detects and extracts K-LLM ensemble orchestration results from planning artifacts.
 * Orchestration occurs when multiple models (DeepSeek R1, Llama 4 Scout, Qwen 3 Coder)
 * run in parallel and Claude 3.5 Sonnet synthesizes their outputs.
 */

export interface OrchestrationData {
  finalText: string;
  modelOutputs: ModelOutput[];
  wildIdeas: WildIdea[];
  synthesizerModel: string;
  totalDurationMs: number;
}

export interface ModelOutput {
  model: string;
  text: string;
  durationMs: number;
  error?: string;
}

export interface WildIdea {
  model: string;
  wildIdea: string;
  reasoning: string;
}

/**
 * Detects if a planning artifact contains K-LLM orchestration results.
 *
 * Orchestration can be found in two ways:
 * 1. Explicit orchestration property in artifact.content
 * 2. The artifact content itself IS the orchestration result
 *
 * @param artifact - The planning artifact to check
 * @returns OrchestrationData if orchestration exists, null otherwise
 */
export function detectOrchestration(
  artifact: { content: unknown }
): OrchestrationData | null {
  if (!artifact || !artifact.content) {
    return null;
  }

  // Strategy 1: Check for explicit orchestration property
  if (
    typeof artifact.content === 'object' &&
    artifact.content !== null &&
    'orchestration' in artifact.content
  ) {
    const orch = (artifact.content as Record<string, unknown>).orchestration;
    if (isOrchestrationStructure(orch)) {
      return orch as OrchestrationData;
    }
  }

  // Strategy 2: Check if content itself is orchestration
  if (isOrchestrationStructure(artifact.content)) {
    return artifact.content as OrchestrationData;
  }

  return null;
}

/**
 * Type guard to check if an object has the structure of orchestration data.
 *
 * Valid orchestration must have:
 * - finalText: string (synthesized result)
 * - modelOutputs: array (individual model responses)
 * - wildIdeas: array (divergent ideas flagged by models)
 * - synthesizerModel: string (which model synthesized)
 *
 * @param obj - Object to check
 * @returns True if object matches OrchestrationData structure
 */
export function isOrchestrationStructure(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const required = ['finalText', 'modelOutputs', 'wildIdeas', 'synthesizerModel'];
  const record = obj as Record<string, unknown>;

  // Check all required properties exist
  const hasRequiredProps = required.every((key) => key in record);
  if (!hasRequiredProps) {
    return false;
  }

  // Validate types
  if (typeof record.finalText !== 'string') {
    return false;
  }

  if (!Array.isArray(record.modelOutputs)) {
    return false;
  }

  if (!Array.isArray(record.wildIdeas)) {
    return false;
  }

  if (typeof record.synthesizerModel !== 'string') {
    return false;
  }

  return true;
}

/**
 * Calculates a consensus score (0-100) based on orchestration results.
 *
 * Score is reduced by:
 * - Wild ideas (-15 points each): Models flagged divergent thinking
 * - Model failures (-10 points each): Models that errored out
 *
 * Higher score = stronger consensus across models
 * Lower score = more divergent thinking or technical issues
 *
 * Score interpretation:
 * - 70-100: High consensus (models agree on solution)
 * - 40-69: Moderate consensus (some divergence)
 * - 0-39: Low consensus (significant divergence or failures)
 *
 * @param orch - Orchestration data
 * @returns Consensus score from 0-100
 */
export function calculateConsensusScore(orch: OrchestrationData): number {
  // Base score is perfect consensus
  let score = 100;

  // Penalize for wild ideas (divergent thinking)
  const wildPenalty = orch.wildIdeas.length * 15;
  score -= wildPenalty;

  // Penalize for model failures
  const failureCount = orch.modelOutputs.filter((m) => m.error).length;
  const failurePenalty = failureCount * 10;
  score -= failurePenalty;

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Gets a human-readable consensus level based on score.
 *
 * @param score - Consensus score (0-100)
 * @returns Consensus level label
 */
export function getConsensusLevel(score: number): 'high' | 'moderate' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

/**
 * Gets a color indicator for consensus level.
 *
 * @param score - Consensus score (0-100)
 * @returns CSS color variable name
 */
export function getConsensusColor(score: number): string {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'orange';
}

/**
 * Extracts successful model outputs (no errors).
 *
 * @param orch - Orchestration data
 * @returns Array of successful model outputs
 */
export function getSuccessfulOutputs(orch: OrchestrationData): ModelOutput[] {
  return orch.modelOutputs.filter((m) => !m.error);
}

/**
 * Extracts failed model outputs (with errors).
 *
 * @param orch - Orchestration data
 * @returns Array of failed model outputs
 */
export function getFailedOutputs(orch: OrchestrationData): ModelOutput[] {
  return orch.modelOutputs.filter((m) => m.error);
}

/**
 * Checks if orchestration has any wild ideas.
 *
 * @param orch - Orchestration data
 * @returns True if wild ideas exist
 */
export function hasWildIdeas(orch: OrchestrationData): boolean {
  return orch.wildIdeas.length > 0;
}

/**
 * Checks if all models succeeded.
 *
 * @param orch - Orchestration data
 * @returns True if no models failed
 */
export function allModelsSucceeded(orch: OrchestrationData): boolean {
  return orch.modelOutputs.every((m) => !m.error);
}

/**
 * Phase Artifact Normalizer
 *
 * Transforms raw planning artifacts into a normalized PhaseDisplayModel
 * with extracted structured data (takeaways, decisions, unknowns, evidence).
 *
 * Uses schema-aware renderers to extract relevant information from each phase's
 * unique artifact structure.
 */

import type { PhaseName, PlanningArtifact } from '$lib/types';
import type { OrchestrationData } from './orchestration-detection';
import { detectOrchestration } from './orchestration-detection';
import { getRendererForPhase } from '$lib/renderers/renderer-registry';

/**
 * Takeaway extracted from phase analysis.
 * Represents key insights, risks, opportunities, or blockers discovered.
 */
export interface Takeaway {
  id: string;
  text: string;
  category: 'insight' | 'risk' | 'opportunity' | 'blocker';
  impact: 'high' | 'medium' | 'low';
}

/**
 * Decision made during a phase.
 * Captures what was decided, why, and the confidence level.
 */
export interface Decision {
  id: string;
  decision: string;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  reversibility: 'reversible' | 'one-way-door';
}

/**
 * Unknown question or uncertainty discovered during a phase.
 * Tracks what needs further investigation.
 */
export interface Unknown {
  id: string;
  question: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  investigationPhase?: string;
}

/**
 * Evidence citation from external sources.
 * Supports claims made in the analysis.
 */
export interface Evidence {
  id: string;
  claim: string;
  url?: string;
  snippet?: string;
  phaseOrigin: PhaseName;
}

/**
 * Phase-specific renderer interface.
 * Each renderer knows how to extract structured data from its phase's artifact.
 */
export interface PhaseRenderer {
  /**
   * Extract takeaways from artifact content.
   */
  extractTakeaways(content: unknown): Takeaway[];

  /**
   * Extract decisions from artifact content.
   */
  extractDecisions(content: unknown): Decision[];

  /**
   * Extract unknowns from artifact content.
   */
  extractUnknowns(content: unknown): Unknown[];

  /**
   * Extract evidence/sources from artifact content.
   */
  extractEvidence(content: unknown, phase: PhaseName): Evidence[];
}

/**
 * Normalized phase data model for display.
 * Combines raw artifact with extracted structured data.
 */
export interface PhaseDisplayModel {
  phase: PhaseName;
  artifact: PlanningArtifact;
  takeaways: Takeaway[];
  decisions: Decision[];
  unknowns: Unknown[];
  evidence: Evidence[];
  orchestration: OrchestrationData | null;
}

/**
 * Generic renderer for phases without custom extractors.
 * Returns empty arrays for all structured data.
 */
export class GenericRenderer implements PhaseRenderer {
  extractTakeaways(_content: unknown): Takeaway[] {
    return [];
  }

  extractDecisions(_content: unknown): Decision[] {
    return [];
  }

  extractUnknowns(_content: unknown): Unknown[] {
    return [];
  }

  extractEvidence(_content: unknown, _phase: PhaseName): Evidence[] {
    return [];
  }
}

/**
 * Default renderer instance.
 * Used when no phase-specific renderer is registered.
 * Exported for use in renderer-registry.ts
 */
const defaultRenderer = new GenericRenderer();

/**
 * Normalizes a raw planning artifact into a structured display model.
 *
 * Extracts:
 * - Takeaways (insights, risks, opportunities, blockers)
 * - Decisions (with rationale and confidence)
 * - Unknowns (questions needing investigation)
 * - Evidence (sources and citations)
 * - Orchestration data (K-LLM ensemble results)
 *
 * @param phase - Phase name
 * @param artifact - Raw planning artifact
 * @returns Normalized phase display model
 */
export function normalizePhaseArtifact(
  phase: PhaseName,
  artifact: PlanningArtifact
): PhaseDisplayModel {
  const renderer = getRendererForPhase(phase);

  return {
    phase,
    artifact,
    takeaways: renderer.extractTakeaways(artifact.content),
    decisions: renderer.extractDecisions(artifact.content),
    unknowns: renderer.extractUnknowns(artifact.content),
    evidence: renderer.extractEvidence(artifact.content, phase),
    orchestration: detectOrchestration(artifact),
  };
}

/**
 * Utility to determine unknown importance from question text.
 * Uses keyword analysis to categorize importance level.
 *
 * @param question - Unknown question text
 * @returns Importance level
 */
export function determineImportance(question: string): 'critical' | 'high' | 'medium' | 'low' {
  const lower = question.toLowerCase();

  // Critical keywords
  const criticalKeywords = ['critical', 'fatal', 'blocker', 'must', 'required', 'essential'];
  if (criticalKeywords.some((kw) => lower.includes(kw))) {
    return 'critical';
  }

  // High importance keywords
  const highKeywords = ['important', 'significant', 'major', 'key', 'core'];
  if (highKeywords.some((kw) => lower.includes(kw))) {
    return 'high';
  }

  // Low importance keywords
  const lowKeywords = ['minor', 'nice to have', 'optional', 'future'];
  if (lowKeywords.some((kw) => lower.includes(kw))) {
    return 'low';
  }

  // Default to medium
  return 'medium';
}

/**
 * Utility to categorize a statement as takeaway type.
 * Uses keyword analysis to determine category.
 *
 * @param text - Takeaway text
 * @returns Category
 */
export function categorizeTakeaway(
  text: string
): 'insight' | 'risk' | 'opportunity' | 'blocker' {
  const lower = text.toLowerCase();

  // Blocker keywords
  const blockerKeywords = ['blocker', 'cannot', 'impossible', 'prevented', 'blocked'];
  if (blockerKeywords.some((kw) => lower.includes(kw))) {
    return 'blocker';
  }

  // Risk keywords
  const riskKeywords = ['risk', 'concern', 'threat', 'danger', 'warning', 'problem'];
  if (riskKeywords.some((kw) => lower.includes(kw))) {
    return 'risk';
  }

  // Opportunity keywords
  const opportunityKeywords = ['opportunity', 'potential', 'advantage', 'could', 'possible'];
  if (opportunityKeywords.some((kw) => lower.includes(kw))) {
    return 'opportunity';
  }

  // Default to insight
  return 'insight';
}

/**
 * Utility to determine impact level from text.
 *
 * @param text - Text to analyze
 * @returns Impact level
 */
export function determineImpact(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();

  // High impact keywords
  const highKeywords = [
    'critical',
    'major',
    'significant',
    'substantial',
    'high',
    'large',
    'massive',
  ];
  if (highKeywords.some((kw) => lower.includes(kw))) {
    return 'high';
  }

  // Low impact keywords
  const lowKeywords = ['minor', 'small', 'minimal', 'slight', 'low'];
  if (lowKeywords.some((kw) => lower.includes(kw))) {
    return 'low';
  }

  // Default to medium
  return 'medium';
}

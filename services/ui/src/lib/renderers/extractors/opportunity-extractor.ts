/**
 * Opportunity Phase Extractor
 *
 * Extracts structured data (takeaways, decisions, unknowns, evidence) from
 * OpportunityAnalysis artifacts.
 *
 * Maps from OpportunityOutput schema to normalized display types.
 */

import type {
  Takeaway,
  Decision,
  Unknown,
  Evidence,
  PhaseRenderer,
} from '$lib/utils/phase-normalizer';
import { determineImportance } from '$lib/utils/phase-normalizer';
import type { PhaseName } from '$lib/types';

/**
 * OpportunityOutput schema (from planning-machine)
 */
interface OpportunityOutput {
  originalIdea?: string | null;
  refinedOpportunities?: OpportunityVariant[] | null;
  recommendedIndex?: number | null;
  keyInsight?: string | null;
  unknowns?: string[] | null;
}

interface OpportunityVariant {
  idea?: string | null;
  description?: string | null;
  revenuePotential?: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  customerUrgency?: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  competitionDensity?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  feasibility?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  agenticScore?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  reasoning?: string | null;
  sources?: Source[] | null;
}

interface Source {
  claim?: string | null;
  url?: string | null;
  snippet?: string | null;
}

/**
 * Extracts takeaways from opportunity analysis.
 *
 * Generates takeaways from:
 * 1. Key insight (high-impact insight)
 * 2. Recommended opportunity (high-impact opportunity)
 * 3. High revenue opportunities (high-impact opportunities)
 * 4. Low competition opportunities (medium-impact opportunities)
 * 5. High feasibility opportunities (insights)
 *
 * @param content - OpportunityOutput artifact content
 * @returns Array of takeaways
 */
export function extractOpportunityTakeaways(content: unknown): Takeaway[] {
  const opp = content as OpportunityOutput;
  const takeaways: Takeaway[] = [];

  if (!opp) return takeaways;

  // Key insight as high-impact takeaway
  if (opp.keyInsight) {
    takeaways.push({
      id: 'key-insight',
      text: opp.keyInsight,
      category: 'insight',
      impact: 'high',
    });
  }

  // Recommended opportunity
  if (
    opp.refinedOpportunities &&
    typeof opp.recommendedIndex === 'number' &&
    opp.recommendedIndex >= 0
  ) {
    const recommended = opp.refinedOpportunities[opp.recommendedIndex];
    if (recommended?.idea && recommended?.reasoning) {
      takeaways.push({
        id: 'recommended',
        text: `Recommended: ${recommended.idea} - ${recommended.reasoning}`,
        category: 'opportunity',
        impact: 'high',
      });
    }
  }

  // High revenue opportunities
  if (opp.refinedOpportunities) {
    opp.refinedOpportunities
      .filter((o) => o?.revenuePotential === 'VERY_HIGH' || o?.revenuePotential === 'HIGH')
      .slice(0, 3) // Limit to top 3
      .forEach((o, i) => {
        if (o?.idea) {
          takeaways.push({
            id: `revenue-${i}`,
            text: `High revenue potential: ${o.idea}`,
            category: 'opportunity',
            impact: 'high',
          });
        }
      });
  }

  // Low competition opportunities
  if (opp.refinedOpportunities) {
    opp.refinedOpportunities
      .filter((o) => o?.competitionDensity === 'LOW')
      .slice(0, 2)
      .forEach((o, i) => {
        if (o?.idea) {
          takeaways.push({
            id: `competition-${i}`,
            text: `Low competition opportunity: ${o.idea}`,
            category: 'opportunity',
            impact: 'medium',
          });
        }
      });
  }

  return takeaways;
}

/**
 * Extracts decisions from opportunity analysis.
 *
 * Primary decision: Which opportunity variant to pursue (recommended)
 *
 * @param content - OpportunityOutput artifact content
 * @returns Array of decisions
 */
export function extractOpportunityDecisions(content: unknown): Decision[] {
  const opp = content as OpportunityOutput;
  const decisions: Decision[] = [];

  if (!opp || !opp.refinedOpportunities) return decisions;

  // Recommended variant decision
  if (typeof opp.recommendedIndex === 'number' && opp.recommendedIndex >= 0) {
    const recommended = opp.refinedOpportunities[opp.recommendedIndex];
    if (recommended?.idea && recommended?.reasoning) {
      // Determine confidence from scores
      const hasHighScores =
        (recommended.revenuePotential === 'VERY_HIGH' || recommended.revenuePotential === 'HIGH') &&
        (recommended.feasibility === 'HIGH') &&
        (recommended.agenticScore === 'HIGH');

      decisions.push({
        id: 'recommended-variant',
        decision: `Pursue opportunity variant #${opp.recommendedIndex + 1}: ${recommended.idea}`,
        rationale: recommended.reasoning,
        confidence: hasHighScores ? 'high' : 'medium',
        reversibility: 'reversible', // Early-stage decisions are typically reversible
      });
    }
  }

  return decisions;
}

/**
 * Extracts unknowns from opportunity analysis.
 *
 * Maps the unknowns array from OpportunityOutput to Unknown objects.
 * Attempts to determine importance from keywords in the question.
 *
 * @param content - OpportunityOutput artifact content
 * @returns Array of unknowns
 */
export function extractOpportunityUnknowns(content: unknown): Unknown[] {
  const opp = content as OpportunityOutput;
  const unknowns: Unknown[] = [];

  if (!opp || !opp.unknowns) return unknowns;

  opp.unknowns.forEach((unknown, i) => {
    if (!unknown) return;

    unknowns.push({
      id: `unknown-${i}`,
      question: unknown,
      importance: determineImportance(unknown),
      investigationPhase: 'customer-intel', // Next relevant phase for unknowns
    });
  });

  return unknowns;
}

/**
 * Extracts evidence from opportunity analysis.
 *
 * Collects all sources from all refined opportunities.
 *
 * @param content - OpportunityOutput artifact content
 * @param phase - Phase name (for evidence tracking)
 * @returns Array of evidence
 */
export function extractOpportunityEvidence(content: unknown, phase: PhaseName): Evidence[] {
  const opp = content as OpportunityOutput;
  const evidence: Evidence[] = [];

  if (!opp || !opp.refinedOpportunities) return evidence;

  opp.refinedOpportunities.forEach((variant, vi) => {
    if (!variant?.sources) return;

    variant.sources.forEach((source, si) => {
      if (!source?.claim) return;

      evidence.push({
        id: `evidence-${vi}-${si}`,
        claim: source.claim,
        url: source.url || undefined,
        snippet: source.snippet || undefined,
        phaseOrigin: phase,
      });
    });
  });

  return evidence;
}

/**
 * OpportunityRenderer implementation.
 * Delegates to extraction functions above.
 */
export class OpportunityRenderer implements PhaseRenderer {
  extractTakeaways(content: unknown): Takeaway[] {
    return extractOpportunityTakeaways(content);
  }

  extractDecisions(content: unknown): Decision[] {
    return extractOpportunityDecisions(content);
  }

  extractUnknowns(content: unknown): Unknown[] {
    return extractOpportunityUnknowns(content);
  }

  extractEvidence(content: unknown, phase: PhaseName): Evidence[] {
    return extractOpportunityEvidence(content, phase);
  }
}

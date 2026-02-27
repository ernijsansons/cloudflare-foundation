/**
 * Documentation Completeness Validator
 *
 * Validates that all required documentation sections are complete
 */

import { getUnresolvedUnknowns } from './unknown-tracker';

// Expected documentation sections (A0-L3)
export const REQUIRED_SECTIONS = [
  'A0', 'A1', 'B0', 'B1', 'C0', 'C1', 'D0',
  'E0', 'F0', 'G0', 'H0', 'I0', 'J0', 'K0',
  'L0', 'L1', 'L2', 'L3',
];

export interface DocCompletenessResult {
  complete: boolean;
  score: number; // 0-100
  missingSections: string[];
  incompleteSections: string[];
  unresolvedCriticalUnknowns: number;
  unresolvedHighUnknowns: number;
  warnings: string[];
}

export async function validateDocumentationCompleteness(
  db: D1Database,
  runId: string,
  documentSections: Record<string, unknown>
): Promise<DocCompletenessResult> {
  const missingSections: string[] = [];
  const incompleteSections: string[] = [];
  const warnings: string[] = [];

  // Check each required section
  for (const section of REQUIRED_SECTIONS) {
    if (!documentSections[section]) {
      missingSections.push(section);
    } else {
      const sectionData = documentSections[section];
      if (typeof sectionData === 'string' && sectionData.length < 50) {
        incompleteSections.push(section);
        warnings.push(`Section ${section} appears incomplete (< 50 characters)`);
      }
    }
  }

  // Check for unresolved unknowns
  const criticalUnknowns = await getUnresolvedUnknowns(db, runId, ['critical']);
  const highUnknowns = await getUnresolvedUnknowns(db, runId, ['high']);

  if (criticalUnknowns.length > 0) {
    warnings.push(`${criticalUnknowns.length} critical unknowns remain unresolved`);
  }

  // Calculate completeness score
  const totalSections = REQUIRED_SECTIONS.length;
  const completedSections = totalSections - missingSections.length - incompleteSections.length;
  let score = Math.round((completedSections / totalSections) * 100);

  // Penalize for unresolved unknowns
  score -= criticalUnknowns.length * 5; // -5 points per critical unknown
  score -= highUnknowns.length * 2; // -2 points per high unknown
  score = Math.max(0, score); // Floor at 0

  const complete =
    missingSections.length === 0 &&
    incompleteSections.length === 0 &&
    criticalUnknowns.length === 0;

  return {
    complete,
    score,
    missingSections,
    incompleteSections,
    unresolvedCriticalUnknowns: criticalUnknowns.length,
    unresolvedHighUnknowns: highUnknowns.length,
    warnings,
  };
}

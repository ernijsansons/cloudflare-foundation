/**
 * Evidence store — tracks citations for every claim
 * Enables: click any claim in output and see the source
 */

export type EvidenceScore = "VERIFIED" | "SUPPORTED" | "UNCERTAIN" | "UNSUPPORTED";

export interface EvidenceRecord {
  artifactId: string;
  runId: string;
  claim: string;
  sourceUrl?: string;
  sourceTitle?: string;
  snippet?: string;
  retrievalDate: number;
  evidenceScore: EvidenceScore;
  searchProvider?: string;
}

export interface StoredEvidence {
  id: number;
  artifact_id: string;
  run_id: string;
  claim: string;
  source_url: string | null;
  source_title: string | null;
  snippet: string | null;
  retrieval_date: number;
  evidence_score: string;
  search_provider: string | null;
}

export async function storeEvidence(
  db: D1Database,
  record: EvidenceRecord
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO planning_sources (artifact_id, run_id, claim, source_url, source_title, snippet, retrieval_date, evidence_score, search_provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      record.artifactId,
      record.runId,
      record.claim,
      record.sourceUrl ?? null,
      record.sourceTitle ?? null,
      record.snippet ?? null,
      record.retrievalDate,
      record.evidenceScore,
      record.searchProvider ?? null
    )
    .run();
}

export async function storeEvidenceBatch(
  db: D1Database,
  records: EvidenceRecord[]
): Promise<void> {
  for (const record of records) {
    await storeEvidence(db, record);
  }
}

export function determineEvidenceScore(
  sources: Array<{ url?: string; provider?: string }>
): EvidenceScore {
  if (sources.length >= 2) return "VERIFIED";
  if (sources.length === 1) return "SUPPORTED";
  return "UNSUPPORTED";
}

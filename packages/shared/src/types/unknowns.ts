/**
 * Unknowns and Handoffs Types
 *
 * Tracks knowledge gaps and cross-phase handoffs in the planning process
 */

export type UnknownCategory =
  | 'market' // Market size, trends, dynamics
  | 'customer' // Customer needs, behavior, willingness to pay
  | 'technical' // Technical feasibility, architecture, implementation
  | 'financial' // Costs, pricing, revenue model
  | 'competitive' // Competitor capabilities, strategies
  | 'regulatory' // Legal, compliance, regulatory requirements
  | 'operational' // Operations, logistics, scaling
  | 'other'; // Other uncategorized unknowns

export type UnknownPriority =
  | 'critical' // Must answer before proceeding
  | 'high' // Important but can proceed with assumptions
  | 'medium' // Nice to know, moderate impact
  | 'low'; // Low impact, can defer

export type UnknownStatus =
  | 'open' // Not yet investigated
  | 'investigating' // Currently being researched
  | 'answered' // Resolved with answer
  | 'deferred' // Intentionally postponed
  | 'obsolete'; // No longer relevant

/**
 * An Unknown represents a knowledge gap that needs to be filled
 */
export interface Unknown {
  id: string;
  runId: string;
  phaseDiscovered: string; // Phase where unknown was identified
  category: UnknownCategory;
  priority: UnknownPriority;
  status: UnknownStatus;

  // Question details
  question: string; // The unknown/question to be answered
  context?: string; // Why this is important, implications
  assumptions?: string; // Current assumptions if proceeding without answer

  // Resolution
  answer?: string; // The discovered answer
  answeredInPhase?: string; // Phase where answer was found
  answeredAt?: Date;
  answeredBy?: string; // Agent or operator who provided answer
  confidence?: number; // 0-100 confidence in the answer

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Handoff status
 */
export type HandoffStatus =
  | 'pending' // Handoff created, not yet accepted
  | 'accepted' // Receiving phase acknowledged handoff
  | 'completed' // Handoff successfully integrated
  | 'rejected'; // Receiving phase rejected handoff

/**
 * A Handoff represents information passed between phases
 */
export interface Handoff {
  id: string;
  runId: string;
  fromPhase: string;
  toPhase: string;
  status: HandoffStatus;

  // Handoff content
  artifactId?: string; // Artifact being handed off
  data: Record<string, unknown>; // Structured data to hand off
  instructions?: string; // Instructions for receiving phase
  dependencies?: string[]; // IDs of artifacts this depends on

  // Tracking
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

/**
 * Unknown resolution workflow
 */
export interface UnknownResolutionWorkflow {
  unknownId: string;
  steps: ResolutionStep[];
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

export interface ResolutionStep {
  phase: string;
  action: string; // What was done to investigate
  result?: string; // What was learned
  confidence: number; // 0-100
  completedAt?: Date;
}

/**
 * Handoff validation result
 */
export interface HandoffValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

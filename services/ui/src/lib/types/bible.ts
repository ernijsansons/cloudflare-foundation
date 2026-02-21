/**
 * Deal Master Bible Types
 *
 * Type definitions for the Deal Master Bible system that aggregates
 * 16 planning phases into 15 department-specific views.
 */

import type { PhaseName } from "./index";

/**
 * Department identifiers in the Deal Master Bible.
 * Each department aggregates relevant information from multiple phases.
 */
export type DepartmentId =
  | "executive"
  | "product"
  | "brand"
  | "market"
  | "customer"
  | "revenue"
  | "gtm"
  | "content"
  | "technical"
  | "analytics"
  | "launch"
  | "risks"
  | "evidence"
  | "agent-json"
  | "phase-trace";

/**
 * Department view aggregating phase data.
 */
export interface DepartmentView {
  id: DepartmentId;
  title: string;
  summary: string;
  sections: DepartmentSection[];
  completeness: number; // 0-100
  lastUpdated: number;
}

/**
 * Section within a department containing aggregated data.
 */
export interface DepartmentSection {
  name: string;
  content: SectionContent;
  sources: PhaseSourceReference[];
  diagrams?: MermaidDiagram[];
}

/**
 * Content types for department sections.
 */
export type SectionContent =
  | { type: "markdown"; text: string }
  | { type: "table"; data: TableData }
  | { type: "list"; items: string[] }
  | { type: "keyValue"; pairs: KeyValuePair[] }
  | { type: "mixed"; blocks: ContentBlock[] };

/**
 * Table data structure.
 */
export interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Key-value pair for structured data.
 */
export interface KeyValuePair {
  key: string;
  value: string | number | boolean;
  type?: "text" | "number" | "boolean" | "currency" | "percentage";
}

/**
 * Mixed content block.
 */
export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "list"; items: string[] }
  | { type: "table"; data: TableData };

/**
 * Reference to source phase and field.
 */
export interface PhaseSourceReference {
  phase: PhaseName;
  field: string;
  extracted: unknown;
}

/**
 * Mermaid diagram definition.
 */
export interface MermaidDiagram {
  title: string;
  diagram: string; // Mermaid syntax
  placement: "inline" | "appendix";
}

/**
 * Department mapping configuration.
 * Defines which phases contribute to each department.
 */
export interface DepartmentMapping {
  primaryPhases: PhaseName[];
  secondaryPhases: PhaseName[];
  sections: SectionMapping[];
}

/**
 * Section mapping configuration.
 */
export interface SectionMapping {
  name: string;
  sources: string[]; // JSONPath-like expressions (e.g., "synthesis.executiveSummary")
  transform?: (data: unknown) => SectionContent;
}

/**
 * Department configuration with metadata.
 */
export interface DepartmentConfig {
  id: DepartmentId;
  title: string;
  description: string;
  icon: string; // SVG path or emoji
  color: string; // CSS color variable name
}

/**
 * All department configurations.
 */
export const DEPARTMENT_CONFIGS: Record<DepartmentId, DepartmentConfig> = {
  executive: {
    id: "executive",
    title: "Executive Summary",
    description: "High-level strategic overview and recommendations",
    icon: "📊",
    color: "blue",
  },
  product: {
    id: "product",
    title: "Product",
    description: "Product vision, features, and roadmap",
    icon: "📦",
    color: "purple",
  },
  brand: {
    id: "brand",
    title: "Brand & Positioning",
    description: "Brand identity, messaging, and market positioning",
    icon: "✨",
    color: "pink",
  },
  market: {
    id: "market",
    title: "Market Analysis",
    description: "Market size, trends, and competitive landscape",
    icon: "📈",
    color: "green",
  },
  customer: {
    id: "customer",
    title: "Customer Intelligence",
    description: "Target customers, personas, and insights",
    icon: "👥",
    color: "cyan",
  },
  revenue: {
    id: "revenue",
    title: "Revenue & Business Model",
    description: "Pricing, revenue streams, and business model",
    icon: "💰",
    color: "yellow",
  },
  gtm: {
    id: "gtm",
    title: "Go-to-Market",
    description: "Marketing strategy, channels, and tactics",
    icon: "🚀",
    color: "orange",
  },
  content: {
    id: "content",
    title: "Content Engine",
    description: "Content strategy, workflows, and distribution",
    icon: "📝",
    color: "teal",
  },
  technical: {
    id: "technical",
    title: "Technical Architecture",
    description: "System design, stack, and infrastructure",
    icon: "⚙️",
    color: "indigo",
  },
  analytics: {
    id: "analytics",
    title: "Analytics & KPIs",
    description: "Metrics, tracking, and success criteria",
    icon: "📊",
    color: "violet",
  },
  launch: {
    id: "launch",
    title: "Launch & Operations",
    description: "Go-live plan, operations, and execution",
    icon: "🎯",
    color: "red",
  },
  risks: {
    id: "risks",
    title: "Risks & Unknowns",
    description: "Risk factors, assumptions, and open questions",
    icon: "⚠️",
    color: "amber",
  },
  evidence: {
    id: "evidence",
    title: "Evidence Library",
    description: "Sources, citations, and supporting data",
    icon: "📚",
    color: "gray",
  },
  "agent-json": {
    id: "agent-json",
    title: "Agent JSON",
    description: "Ralph Loop implementation payload",
    icon: "🤖",
    color: "emerald",
  },
  "phase-trace": {
    id: "phase-trace",
    title: "Phase Trace",
    description: "Audit trail of all 16 planning phases",
    icon: "🔍",
    color: "slate",
  },
};

/**
 * Gets the display title for a department.
 */
export function getDepartmentTitle(id: DepartmentId): string {
  return DEPARTMENT_CONFIGS[id]?.title || id;
}

/**
 * Gets the description for a department.
 */
export function getDepartmentDescription(id: DepartmentId): string {
  return DEPARTMENT_CONFIGS[id]?.description || "";
}

/**
 * Gets the icon for a department.
 */
export function getDepartmentIcon(id: DepartmentId): string {
  return DEPARTMENT_CONFIGS[id]?.icon || "📄";
}

/**
 * Gets the color for a department.
 */
export function getDepartmentColor(id: DepartmentId): string {
  return DEPARTMENT_CONFIGS[id]?.color || "gray";
}

/**
 * Comprehensive type definitions for the Project Documentation System
 *
 * Supports full documentation of agentic projects across 13 sections (A-M)
 * enabling one-shot execution with zero additional context.
 */

// ============================================================================
// SECTION A: ASSUMPTIONS + UNKNOWN INPUTS
// ============================================================================

export interface IntakeConcept {
	codename: string;
	thesis: string;
	target_icp: string;
	core_directive: string;
	why_now: string;
}

export interface OutcomeUnit {
	definition: string;
	proof_artifact: string;
	time_to_first_outcome: string;
	frequency: string;
	current_cost: string;
}

export interface AgenticExecution {
	allowed_actions: string[];
	forbidden_actions: string[];
	hitl_threshold: string[];
	required_integrations: string[];
	external_side_effects: string[];
}

export interface InputSource {
	source: string;
	licensing: string;
}

export interface DataTrust {
	input_sources: InputSource[];
	output_data_types: string[];
	data_sensitivity: 'public' | 'internal' | 'confidential' | 'financial' | 'pii' | 'health';
	retention_requirements: string;
	ground_truth: string;
}

export interface Constraints {
	budget_cap: string;
	timeline: string;
	geography: string;
	compliance_bar: 'bootstrap' | 'SOC2-ready' | 'regulated';
	performance_bar: string;
}

export interface Monetization {
	who_pays: string;
	pricing_anchor: string;
	sales_motion: 'self-serve' | 'sales-led' | 'hybrid';
	value_metric: string;
}

export interface SuccessKillSwitches {
	north_star: string;
	supporting_metrics: string[];
	kill_conditions: string[];
	'30_day_done': string;
	'90_day_done': string;
}

export interface IntakeForm {
	concept: IntakeConcept;
	outcome_unit: OutcomeUnit;
	agentic_execution: AgenticExecution;
	data_trust: DataTrust;
	constraints: Constraints;
	monetization: Monetization;
	success_kill_switches: SuccessKillSwitches;
}

export interface Unknowns {
	core_directive: 'RESOLVED' | 'UNKNOWN';
	hitl_threshold: 'RESOLVED' | 'UNKNOWN';
	tooling_data_gravity: 'RESOLVED' | 'UNKNOWN' | string;
	memory_horizon: 'RESOLVED' | 'UNKNOWN' | string;
	verification_standard: 'RESOLVED' | 'UNKNOWN' | string;
}

export interface GlobalInvariants {
	no_raw_destructive_ops: boolean;
	idempotent_side_effects: boolean;
	auditable_receipts: boolean;
	llm_gateway: string;
	fail_closed: boolean;
}

export interface SectionA {
	A0_intake: IntakeForm;
	A1_unknowns: Unknowns;
	A2_invariants: GlobalInvariants;
}

// ============================================================================
// SECTION B: NORTH STAR
// ============================================================================

export interface BusinessStatement {
	statement: string;
	target_outcome: string;
	proof_of_value: string;
}

export interface Differentiation {
	persistent_stateful_agents: boolean;
	verifiable_outcomes: boolean;
	secure_execution: boolean;
	durable_orchestration: boolean;
	cost_controlled: boolean;
	custom_differentiators: string[];
}

export interface MonetizationModel {
	model_type: 'digital_work' | 'seats' | 'usage' | 'hybrid';
	platform_fee: string;
	bundles: string[];
	higher_tiers: string[];
}

export interface SuccessMetrics {
	north_star: string;
	autonomous_success_rate_target: number;
	cost_per_outcome_target: string;
	time_to_outcome_targets: {
		p50: string;
		p95: string;
	};
	hitl_override_rate_target: number;
}

export interface SectionB {
	business_statement: BusinessStatement;
	differentiation: Differentiation;
	monetization_model: MonetizationModel;
	success_metrics: SuccessMetrics;
}

// ============================================================================
// SECTION C: MASTER CHECKLIST
// ============================================================================

export interface ChecklistItem {
	id: string;
	task: string;
	dod: string; // Definition of Done
	owner: string;
	tools: string;
	effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
	dependencies: string[];
	status: 'pending' | 'in-progress' | 'done' | 'blocked';
}

export interface SectionC {
	C1_agent_definition: ChecklistItem[];
	C2_tool_definition: ChecklistItem[];
	C3_infrastructure: ChecklistItem[];
	C4_memory_architecture: ChecklistItem[];
	C5_auth_delegation: ChecklistItem[];
	C6_agent_loop: ChecklistItem[];
	C7_model_routing: ChecklistItem[];
	C8_mcp_servers: ChecklistItem[];
	C9_long_running_tasks: ChecklistItem[];
	C10_hitl: ChecklistItem[];
	C11_agentic_ux: ChecklistItem[];
	C12_security_boundaries: ChecklistItem[];
	C13_evals_testing: ChecklistItem[];
	C14_observability: ChecklistItem[];
	C15_pricing_billing: ChecklistItem[];
	C16_gtm: ChecklistItem[];
	C17_sales: ChecklistItem[];
	C18_customer_success: ChecklistItem[];
	C19_ops_finance: ChecklistItem[];
	C20_scale_reliability: ChecklistItem[];
}

// ============================================================================
// SECTION D: CLOUDFLARE ARCHITECTURE
// ============================================================================

export interface ComponentDecision {
	component: string;
	purpose: string;
	technology: string;
	rationale: string;
}

export interface DataModel {
	entity: string;
	storage_type: 'D1' | 'R2' | 'KV' | 'Vectorize' | 'DO-SQLite';
	schema: string;
	relationships: string[];
}

export interface APIEndpoint {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	path: string;
	purpose: string;
	auth_required: boolean;
	idempotency_required: boolean;
}

export interface SectionD {
	architecture_diagram_url?: string;
	architecture_description: string;
	component_decisions: ComponentDecision[];
	data_model: DataModel[];
	api_endpoints: APIEndpoint[];
	auth_design: string;
	caching_strategy: string;
	rate_limiting: string;
	backup_dr: string;
}

// ============================================================================
// SECTION E: FRONTEND SYSTEM
// ============================================================================

export interface UXPrimitive {
	name: string;
	description: string;
	required: boolean;
}

export interface DesignToken {
	category: 'spacing' | 'typography' | 'color' | 'other';
	name: string;
	value: string;
}

export interface Component {
	name: string;
	purpose: string;
	props: string[];
}

export interface SectionE {
	ux_primitives: UXPrimitive[];
	design_tokens: DesignToken[];
	component_library: Component[];
	accessibility_requirements: string[];
	onboarding_flow: string[];
}

// ============================================================================
// SECTION F: BACKEND/MIDDLEWARE
// ============================================================================

export interface WorkflowStep {
	step_number: number;
	name: string;
	description: string;
	tools_used: string[];
}

export interface MCPGovernanceRule {
	rule: string;
	enforcement: string;
}

export interface Receipt {
	name: string;
	fields: string[];
	verification_method: string;
}

export interface SectionF {
	universal_workflow_pattern: WorkflowStep[];
	mcp_governance_rules: MCPGovernanceRule[];
	receipts_format: Receipt[];
	verification_format: string;
	admin_panel_features: string[];
}

// ============================================================================
// SECTION G: PRICING + UNIT ECONOMICS
// ============================================================================

export interface ValueMetric {
	metric: string;
	rationale: string;
	customer_value_alignment: string;
}

export interface CostDriver {
	driver: string;
	estimated_cost_per_outcome: string;
	optimization_strategy: string;
}

export interface MarkupModel {
	internal_cost: string;
	price_point: string;
	margin_percentage: number;
}

export interface UnitEconomics {
	gross_profit_per_outcome: string;
	breakeven_outcomes: number;
	cac_estimate: string;
	ltv_estimate: string;
}

export interface SectionG {
	value_metric: ValueMetric;
	cost_drivers: CostDriver[];
	markup_model: MarkupModel;
	unit_economics: UnitEconomics;
	pricing_tiers: string[];
}

// ============================================================================
// SECTION H: GO-TO-MARKET
// ============================================================================

export interface PositioningStatement {
	for_icp: string;
	who_need: string;
	we_provide: string;
	that_delivers: string;
}

export interface ProofAsset {
	asset_type: 'video' | 'document' | 'demo' | 'case_study';
	name: string;
	purpose: string;
}

export interface AcquisitionChannel {
	channel: string;
	priority: number;
	estimated_cac: string;
	rationale: string;
}

export interface FunnelMetric {
	stage: string;
	metric_name: string;
	target: string;
}

export interface SectionH {
	positioning_statement: PositioningStatement;
	proof_assets: ProofAsset[];
	acquisition_channels: AcquisitionChannel[];
	funnel_metrics: FunnelMetric[];
	launch_plan: string;
	retention_loops: string[];
}

// ============================================================================
// SECTION I: BRAND IDENTITY
// ============================================================================

export interface NamingFramework {
	naming_approach: string;
	finalist_names: string[];
	selected_name: string;
	rationale: string;
}

export interface DomainHandles {
	domain: string;
	social_handles: Record<string, string>;
}

export interface VisualIdentity {
	color_palette: string[];
	typography: string;
	logo_concept: string;
	brand_voice: string;
}

export interface ContentTemplate {
	template_name: string;
	purpose: string;
	structure: string[];
}

export interface SectionI {
	naming_framework: NamingFramework;
	domain_handles: DomainHandles;
	visual_identity: VisualIdentity;
	content_templates: ContentTemplate[];
}

// ============================================================================
// SECTION J: SECURITY + COMPLIANCE
// ============================================================================

export interface ThreatModelItem {
	threat: string;
	probability: 'low' | 'medium' | 'high';
	impact: 'low' | 'medium' | 'high' | 'fatal';
	mitigation: string;
}

export interface SecurityControl {
	control_name: string;
	description: string;
	implementation_status: 'planned' | 'in-progress' | 'implemented';
}

export interface DataHandlingPolicy {
	data_type: string;
	retention_period: string;
	encryption: boolean;
	access_controls: string;
}

export interface IncidentResponse {
	phase: string;
	actions: string[];
	owner: string;
}

export interface SectionJ {
	threat_model: ThreatModelItem[];
	security_controls: SecurityControl[];
	data_handling: DataHandlingPolicy[];
	incident_response: IncidentResponse[];
	compliance_posture: string;
}

// ============================================================================
// SECTION K: TESTING + OBSERVABILITY
// ============================================================================

export interface TestingStrategy {
	test_type: 'unit' | 'integration' | 'e2e' | 'regression' | 'security';
	coverage_target: number;
	tools: string[];
}

export interface ContinuousEval {
	eval_name: string;
	frequency: string;
	rubric: string;
	failure_threshold: string;
}

export interface MonitoringDashboard {
	dashboard_name: string;
	metrics: string[];
	alert_conditions: string[];
}

export interface SLO {
	slo_name: string;
	target: string;
	measurement_method: string;
}

export interface SectionK {
	testing_strategies: TestingStrategy[];
	continuous_evals: ContinuousEval[];
	monitoring_dashboards: MonitoringDashboard[];
	slos: SLO[];
	rollback_procedure: string;
}

// ============================================================================
// SECTION L: OPERATIONS PLAYBOOK
// ============================================================================

export interface OperatingCadence {
	frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
	activities: string[];
	owner: string;
}

export interface SupportWorkflow {
	issue_type: string;
	triage_steps: string[];
	escalation_path: string;
	sla: string;
}

export interface ChurnPlaybook {
	churn_signal: string;
	intervention: string;
	owner: string;
}

export interface BillingOps {
	process: string;
	frequency: string;
	automation_level: 'manual' | 'semi-automated' | 'fully-automated';
}

export interface SectionL {
	operating_cadence: OperatingCadence[];
	support_workflows: SupportWorkflow[];
	churn_playbooks: ChurnPlaybook[];
	billing_ops: BillingOps[];
}

// ============================================================================
// SECTION M: EXECUTION ROADMAP
// ============================================================================

export interface RoadmapPhase {
	phase_number: number;
	phase_name: string;
	duration_weeks: number;
	deliverables: string[];
	gate_criteria: string[];
}

export interface Milestone {
	week: number;
	milestone_name: string;
	deliverables: string[];
	blocking: boolean;
}

export interface SectionM {
	roadmap_phases: RoadmapPhase[];
	weekly_milestones: Milestone[];
	critical_path: string[];
	resource_allocation: string;
}

// ============================================================================
// OVERVIEW TAB (AUTO-GENERATED)
// ============================================================================

export interface ExecutiveSummary {
	concept: string;
	status: 'planning' | 'in-progress' | 'blocked' | 'complete';
	completeness: number; // 0-100
	key_metrics: Record<string, string | number>;
}

export interface QuickStats {
	budget: string;
	timeline: string;
	north_star_metric: string;
	current_phase: string;
}

export interface HealthIndicators {
	documentation_complete: boolean;
	unknowns_resolved: boolean;
	checklist_progress: number; // 0-100
	security_coverage: number; // 0-100
}

export interface CriticalPath {
	next_milestone: string;
	blockers: string[];
	dependencies: string[];
}

export interface QuickAction {
	label: string;
	link: string;
}

export interface OverviewSection {
	executive_summary: ExecutiveSummary;
	quick_stats: QuickStats;
	health_indicators: HealthIndicators;
	critical_path: CriticalPath;
	quick_actions: QuickAction[];
}

// ============================================================================
// COMPLETE PROJECT DOCUMENTATION
// ============================================================================

export interface ProjectDocumentation {
	project_id: string;
	overview: OverviewSection;
	A: SectionA;
	B: SectionB;
	C: SectionC;
	D: SectionD;
	E: SectionE;
	F: SectionF;
	G: SectionG;
	H: SectionH;
	I: SectionI;
	J: SectionJ;
	K: SectionK;
	L: SectionL;
	M: SectionM;
	metadata: {
		completeness: number;
		last_updated: number;
		status: 'incomplete' | 'complete' | 'approved' | 'archived';
	};
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface ProjectDocumentationRow {
	id: string;
	project_id: string;
	section_id: string;
	subsection_key: string | null;
	content: string; // JSON stringified
	status: 'draft' | 'reviewed' | 'approved';
	populated_by: string | null;
	last_updated: number;
	created_at: number;
}

export interface ProjectDocumentationMetadataRow {
	project_id: string;
	completeness_percentage: number;
	total_sections: number;
	populated_sections: number;
	required_unknowns_resolved: number;
	status: 'incomplete' | 'complete' | 'approved' | 'archived';
	last_updated: number;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GetProjectDocsResponse {
	project_id: string;
	sections: Partial<ProjectDocumentation>;
	metadata: {
		completeness: number;
		last_updated: number;
		status: 'incomplete' | 'complete' | 'approved' | 'archived';
	};
}

export interface GetSectionResponse {
	section_id: string;
	content: Record<string, unknown>;
	subsections: Record<string, unknown>;
	status: string;
	last_updated: number;
}

export interface UpdateSectionRequest {
	subsection_key?: string;
	content: Record<string, unknown>;
	status?: 'draft' | 'reviewed' | 'approved';
}

export interface GenerateOverviewResponse {
	overview: OverviewSection;
}

// ============================================================================
// SECTION ID TYPES
// ============================================================================

export type SectionId =
	| 'overview'
	| 'A'
	| 'B'
	| 'C'
	| 'D'
	| 'E'
	| 'F'
	| 'G'
	| 'H'
	| 'I'
	| 'J'
	| 'K'
	| 'L'
	| 'M';

export const SECTION_NAMES: Record<SectionId, string> = {
	overview: 'Overview',
	A: 'Assumptions + Inputs',
	B: 'North Star',
	C: 'Master Checklist',
	D: 'Cloudflare Architecture',
	E: 'Frontend System',
	F: 'Backend/Middleware',
	G: 'Pricing + Unit Economics',
	H: 'Go-to-Market',
	I: 'Brand Identity',
	J: 'Security + Compliance',
	K: 'Testing + Observability',
	L: 'Operations Playbook',
	M: 'Execution Roadmap'
};

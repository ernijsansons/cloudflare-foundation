import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte/svelte5';
import SectionA from './SectionA.svelte';
import type { SectionA as SectionAType } from '@foundation/shared';

describe('SectionA', () => {
	const mockData: SectionAType = {
		A0_intake: {
			concept: {
				codename: 'DOCGEN',
				thesis: 'AI-powered documentation system',
				target_icp: 'Developer platform teams',
				core_directive: 'Generate comprehensive project documentation',
				why_now: 'Teams need faster onboarding and delivery'
			},
			outcome_unit: {
				definition: 'Documentation completeness percentage',
				proof_artifact: 'Published documentation bundle',
				time_to_first_outcome: '2 days',
				frequency: 'Weekly',
				current_cost: '$50,000 per quarter'
			},
			agentic_execution: {
				allowed_actions: ['Generate markdown docs', 'Create architecture diagrams'],
				forbidden_actions: ['Delete production data'],
				hitl_threshold: ['When validation score < 80%', 'When unknown fields detected'],
				required_integrations: ['D1', 'GitHub'],
				external_side_effects: ['Create pull request']
			},
			data_trust: {
				input_sources: [{ source: 'Project planning data', licensing: 'Internal' }],
				output_data_types: ['Markdown', 'JSON'],
				data_sensitivity: 'internal',
				retention_requirements: '90 days',
				ground_truth: 'Validated project documentation'
			},
			constraints: {
				budget_cap: '$50,000',
				timeline: '8 weeks',
				geography: 'US-West',
				compliance_bar: 'SOC2-ready',
				performance_bar: '< 2s response time'
			},
			monetization: {
				who_pays: 'Internal platform team',
				pricing_anchor: 'Cost avoided per onboarded service',
				sales_motion: 'hybrid',
				value_metric: 'Documentation sets delivered'
			},
			success_kill_switches: {
				north_star: 'Documentation completion rate > 95%',
				supporting_metrics: ['Cycle time < 2 days'],
				kill_conditions: ['Quality score < 60% for 7 consecutive days'],
				'30_day_done': 'MVP live',
				'90_day_done': 'Org-wide rollout'
			}
		},
		A1_unknowns: {
			core_directive: 'RESOLVED',
			hitl_threshold: 'UNKNOWN',
			tooling_data_gravity: 'RESOLVED',
			memory_horizon: 'UNKNOWN',
			verification_standard: 'RESOLVED'
		},
		A2_invariants: {
			no_raw_destructive_ops: true,
			idempotent_side_effects: true,
			auditable_receipts: true,
			llm_gateway: 'Cloudflare AI Gateway',
			fail_closed: false
		}
	};

	it('renders empty state when no data provided', () => {
		const { getByText } = render(SectionA, { props: { data: undefined } });

		expect(getByText('No Assumptions Data')).toBeInTheDocument();
		expect(getByText(/Section A will be populated/)).toBeInTheDocument();
	});

	it('renders all subsection headers and key cards when data is provided', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('A0: Idea Intake Form')).toBeInTheDocument();
		expect(getByText('Concept')).toBeInTheDocument();
		expect(getByText('Outcome Unit')).toBeInTheDocument();
		expect(getByText('Agentic Execution')).toBeInTheDocument();
		expect(getByText('Constraints')).toBeInTheDocument();
		expect(getByText('Monetization')).toBeInTheDocument();
		expect(getByText('A1: Required Unknowns')).toBeInTheDocument();
		expect(getByText('A2: Global Invariants')).toBeInTheDocument();
	});

	it('displays concept and outcome unit correctly', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('DOCGEN')).toBeInTheDocument();
		expect(getByText('AI-powered documentation system')).toBeInTheDocument();
		expect(getByText('Documentation completeness percentage')).toBeInTheDocument();
	});

	it('displays agentic execution details', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('Generate markdown docs')).toBeInTheDocument();
		expect(getByText('Create architecture diagrams')).toBeInTheDocument();
		expect(getByText('Delete production data')).toBeInTheDocument();
	});

	it('displays HITL thresholds as list', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText(/When validation score/)).toBeInTheDocument();
		expect(getByText(/When unknown fields detected/)).toBeInTheDocument();
	});

	it('renders A1 unknowns with resolved/pending status', () => {
		const { getByText, container } = render(SectionA, { props: { data: mockData } });

		expect(getByText('A1: Required Unknowns')).toBeInTheDocument();

		const resolvedItems = container.querySelectorAll('.unknown-value.resolved');
		const unresolvedItems = container.querySelectorAll('.unknown-item.unresolved');

		expect(resolvedItems.length).toBeGreaterThan(0);
		expect(unresolvedItems.length).toBeGreaterThan(0);
	});

	it('displays A1 unknowns with proper styling', () => {
		const { container } = render(SectionA, { props: { data: mockData } });

		const resolvedItem = container.querySelector('.unknown-value.resolved');
		expect(resolvedItem).toHaveClass('resolved');

		const unresolvedItem = container.querySelector('.unknown-item.unresolved');
		expect(unresolvedItem).toHaveClass('unresolved');
	});

	it('renders A2 invariants section', () => {
		const { getByText, container } = render(SectionA, { props: { data: mockData } });

		expect(getByText('A2: Global Invariants')).toBeInTheDocument();

		const invariantItems = container.querySelectorAll('.invariant-item');
		expect(invariantItems.length).toBe(5); // 5 invariants in mockData
	});

	it('displays invariants with correct icons', () => {
		const { container } = render(SectionA, { props: { data: mockData } });

		const icons = Array.from(container.querySelectorAll('.invariant-icon')).map((node) =>
			node.textContent?.trim()
		);
		expect(icons).toContain('✅');
		expect(icons).toContain('❌');
	});

	it('displays budget and timeline constraints', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('$50,000')).toBeInTheDocument();
		expect(getByText('8 weeks')).toBeInTheDocument();
	});

	it('displays monetization details', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('Internal platform team')).toBeInTheDocument();
		expect(getByText('hybrid')).toBeInTheDocument();
	});

	it('displays llm gateway invariant value', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('Cloudflare AI Gateway')).toBeInTheDocument();
	});
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SectionA from './SectionA.svelte';
import type { SectionA as SectionAType } from '@foundation/shared';

describe('SectionA', () => {
	const mockData: SectionAType = {
		A0: {
			concept: 'AI-powered documentation system',
			outcome_unit: 'Documentation completeness percentage',
			agentic_execution: {
				core_directive: 'Generate comprehensive project documentation',
				hitl_thresholds: ['When validation score < 80%', 'When unknown fields detected'],
				tooling_data_gravity: 'Project planning data from D1',
				memory_horizon: '30 days',
				verification_standard: 'WCAG AA compliance + 80% test coverage'
			},
			data_and_trust: {
				pii_handling: 'No PII collected',
				auth_method: 'Cloudflare Access',
				data_residency: 'US-West'
			},
			constraints: {
				budget: '$50,000',
				timeline: '8 weeks',
				regulatory: []
			},
			monetization: {
				model: 'Internal tool - no monetization',
				pricing_tiers: []
			},
			success_and_kill_switches: {
				north_star_metric: 'Documentation completion rate > 95%',
				kill_switch: 'If quality score < 60% for 7 consecutive days'
			}
		},
		A1: {
			core_directive: 'resolved',
			hitl_threshold: 'pending',
			tooling_data_gravity: 'resolved',
			memory_horizon: 'resolved',
			verification_standard: 'pending'
		},
		A2: {
			no_raw_destructive_ops: true,
			idempotent_side_effects: true,
			auditable_receipts: true,
			llm_gateway: true,
			fail_closed: false
		}
	};

	it('renders empty state when no data provided', () => {
		const { getByText } = render(SectionA, { props: { data: undefined } });

		expect(getByText('No Assumptions Data')).toBeInTheDocument();
		expect(getByText(/Section A will be populated/)).toBeInTheDocument();
	});

	it('renders all A0 subsections when data is provided', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('Concept & Outcome')).toBeInTheDocument();
		expect(getByText('Agentic Execution')).toBeInTheDocument();
		expect(getByText('Data & Trust')).toBeInTheDocument();
		expect(getByText('Constraints')).toBeInTheDocument();
		expect(getByText('Monetization')).toBeInTheDocument();
		expect(getByText('Success & Kill Switches')).toBeInTheDocument();
	});

	it('displays concept and outcome unit correctly', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('AI-powered documentation system')).toBeInTheDocument();
		expect(getByText('Documentation completeness percentage')).toBeInTheDocument();
	});

	it('displays agentic execution details', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('Generate comprehensive project documentation')).toBeInTheDocument();
		expect(getByText('30 days')).toBeInTheDocument();
		expect(getByText(/WCAG AA compliance/)).toBeInTheDocument();
	});

	it('displays HITL thresholds as list', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText(/When validation score/)).toBeInTheDocument();
		expect(getByText(/When unknown fields detected/)).toBeInTheDocument();
	});

	it('renders A1 unknowns with resolved/pending status', () => {
		const { getByText, container } = render(SectionA, { props: { data: mockData } });

		expect(getByText('A1: Unknowns Resolution')).toBeInTheDocument();

		const resolvedItems = container.querySelectorAll('.unknown-item.resolved');
		const unresolvedItems = container.querySelectorAll('.unknown-item.unresolved');

		expect(resolvedItems.length).toBeGreaterThan(0);
		expect(unresolvedItems.length).toBeGreaterThan(0);
	});

	it('displays A1 unknowns with proper styling', () => {
		const { container } = render(SectionA, { props: { data: mockData } });

		const resolvedItem = container.querySelector('.unknown-item.resolved');
		expect(resolvedItem).toHaveClass('resolved');

		const unresolvedItem = container.querySelector('.unknown-item.unresolved');
		expect(unresolvedItem).toHaveClass('unresolved');
	});

	it('renders A2 invariants section', () => {
		const { getByText, container } = render(SectionA, { props: { data: mockData } });

		expect(getByText('A2: Invariants')).toBeInTheDocument();

		const invariantItems = container.querySelectorAll('.invariant-item');
		expect(invariantItems.length).toBe(5); // 5 invariants in mockData
	});

	it('displays invariants with correct icons', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		// Check for checkmark icons (true values)
		expect(getByText('✅', { selector: '.invariant-icon' })).toBeDefined();
	});

	it('displays budget and timeline constraints', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText('$50,000')).toBeInTheDocument();
		expect(getByText('8 weeks')).toBeInTheDocument();
	});

	it('displays north star metric', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText(/Documentation completion rate > 95%/)).toBeInTheDocument();
	});

	it('displays kill switch condition', () => {
		const { getByText } = render(SectionA, { props: { data: mockData } });

		expect(getByText(/If quality score < 60%/)).toBeInTheDocument();
	});
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte/svelte5';
import LoadingSkeleton from './LoadingSkeleton.svelte';

describe('LoadingSkeleton', () => {
	it('renders card skeleton by default', () => {
		const { container } = render(LoadingSkeleton);

		expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
		expect(container.querySelector('.skeleton-header')).toBeInTheDocument();
	});

	it('renders card skeleton when type is card', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'card' }
		});

		expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
		expect(container.querySelectorAll('.skeleton-line')).toHaveLength(3);
	});

	it('renders table skeleton when type is table', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'table', rows: 4 }
		});

		expect(container.querySelector('.skeleton-table')).toBeInTheDocument();
		expect(container.querySelector('.skeleton-table-header')).toBeInTheDocument();
		expect(container.querySelectorAll('.skeleton-table-row')).toHaveLength(4);
	});

	it('renders header skeleton when type is header', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'header' }
		});

		expect(container.querySelector('.skeleton-header-large')).toBeInTheDocument();
	});

	it('renders list skeleton when type is list', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'list', rows: 5 }
		});

		expect(container.querySelector('.skeleton-list')).toBeInTheDocument();
		expect(container.querySelectorAll('.skeleton-list-item')).toHaveLength(5);
		expect(container.querySelectorAll('.skeleton-bullet')).toHaveLength(5);
	});

	it('renders text skeleton when type is text', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'text', rows: 3 }
		});

		expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
		expect(container.querySelectorAll('.skeleton-line')).toHaveLength(3);
	});

	it('renders correct number of rows for table skeleton', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'table', rows: 7 }
		});

		expect(container.querySelectorAll('.skeleton-table-row')).toHaveLength(7);
	});

	it('renders shimmer placeholder elements', () => {
		const { container } = render(LoadingSkeleton, {
			props: { type: 'card' }
		});

		const skeletonElement = container.querySelector('.skeleton-header');
		expect(skeletonElement).toBeInTheDocument();

		const placeholders = container.querySelectorAll(
			'.skeleton-header, .skeleton-line, .skeleton-cell, .skeleton-bullet, .skeleton-table-header'
		);
		expect(placeholders.length).toBeGreaterThan(0);
	});
});

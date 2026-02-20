import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';

describe('Sidebar', () => {
	const mockSections = [
		{ id: 'overview', label: 'Overview', icon: '📊' },
		{ id: 'A', label: 'Assumptions', icon: '📝' },
		{ id: 'B', label: 'North Star', icon: '⭐' },
		{ id: 'C', label: 'Checklist', icon: '✅' }
	];

	it('renders all sections', () => {
		const { getByText } = render(Sidebar, {
			props: {
				sections: mockSections,
				activeSection: 'overview'
			}
		});

		expect(getByText('Overview')).toBeInTheDocument();
		expect(getByText('Assumptions')).toBeInTheDocument();
		expect(getByText('North Star')).toBeInTheDocument();
		expect(getByText('Checklist')).toBeInTheDocument();
	});

	it('highlights active section', () => {
		const { getByLabelText } = render(Sidebar, {
			props: {
				sections: mockSections,
				activeSection: 'A'
			}
		});

		const activeButton = getByLabelText('Assumptions section');
		expect(activeButton).toHaveClass('active');
		expect(activeButton).toHaveAttribute('aria-current', 'page');
	});

	it('emits sectionChange event when section is clicked', async () => {
		const { component, getByLabelText } = render(Sidebar, {
			props: {
				sections: mockSections,
				activeSection: 'overview'
			}
		});

		const sectionChangeFn = vi.fn();
		component.$on('sectionChange', sectionChangeFn);

		const assumptionsButton = getByLabelText('Assumptions section');
		await fireEvent.click(assumptionsButton);

		expect(sectionChangeFn).toHaveBeenCalled();
		expect(sectionChangeFn.mock.calls[0][0].detail).toBe('A');
	});

	it('displays icons for each section', () => {
		const { getByText } = render(Sidebar, {
			props: {
				sections: mockSections,
				activeSection: 'overview'
			}
		});

		expect(getByText('📊')).toBeInTheDocument();
		expect(getByText('📝')).toBeInTheDocument();
		expect(getByText('⭐')).toBeInTheDocument();
		expect(getByText('✅')).toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		const { container } = render(Sidebar, {
			props: {
				sections: mockSections,
				activeSection: 'overview'
			}
		});

		const nav = container.querySelector('nav');
		expect(nav).toHaveAttribute('aria-label', 'Documentation sections');
	});
});

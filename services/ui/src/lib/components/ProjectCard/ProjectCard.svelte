<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ProjectDocumentation } from '@foundation/shared';
	import Sidebar from './Sidebar.svelte';
	import OverviewTab from './OverviewTab.svelte';
	import SectionA from './SectionA.svelte';
	import SectionB from './SectionB.svelte';
	import SectionC from './SectionC.svelte';
	import SectionD from './SectionD.svelte';
	import SectionE from './SectionE.svelte';
	import SectionF from './SectionF.svelte';
	import SectionG from './SectionG.svelte';
	import SectionH from './SectionH.svelte';
	import SectionI from './SectionI.svelte';
	import SectionJ from './SectionJ.svelte';
	import SectionK from './SectionK.svelte';
	import SectionL from './SectionL.svelte';
	import SectionM from './SectionM.svelte';
	import LoadingSkeleton from './LoadingSkeleton.svelte';

	export let projectId: string;
	export let projectName: string;
	export let documentation: Partial<ProjectDocumentation> | null = null;
	export let loading = false;
	export let onClose: (() => void) | undefined = undefined;

	let activeSection: string = 'overview';

	const sections = [
		{ id: 'overview', label: 'Overview', icon: '📊' },
		{ id: 'A', label: 'Assumptions', icon: '📝' },
		{ id: 'B', label: 'North Star', icon: '⭐' },
		{ id: 'C', label: 'Checklist', icon: '✅' },
		{ id: 'D', label: 'Architecture', icon: '🏗️' },
		{ id: 'E', label: 'Frontend', icon: '🎨' },
		{ id: 'F', label: 'Backend', icon: '⚙️' },
		{ id: 'G', label: 'Pricing', icon: '💰' },
		{ id: 'H', label: 'GTM', icon: '🚀' },
		{ id: 'I', label: 'Brand', icon: '🎯' },
		{ id: 'J', label: 'Security', icon: '🔒' },
		{ id: 'K', label: 'Testing', icon: '🧪' },
		{ id: 'L', label: 'Operations', icon: '⚡' },
		{ id: 'M', label: 'Roadmap', icon: '🗺️' }
	];

	function handleSectionChange(sectionId: string) {
		activeSection = sectionId;
	}

	function navigateToSection(direction: 'next' | 'prev' | 'first' | 'last') {
		const currentIndex = sections.findIndex((s) => s.id === activeSection);
		let newIndex: number;

		switch (direction) {
			case 'next':
				newIndex = Math.min(currentIndex + 1, sections.length - 1);
				break;
			case 'prev':
				newIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'first':
				newIndex = 0;
				break;
			case 'last':
				newIndex = sections.length - 1;
				break;
		}

		if (newIndex !== currentIndex) {
			activeSection = sections[newIndex].id;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Skip if user is typing in an input/textarea
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
			case 'j':
				event.preventDefault();
				navigateToSection('next');
				break;
			case 'ArrowUp':
			case 'k':
				event.preventDefault();
				navigateToSection('prev');
				break;
			case 'Home':
				event.preventDefault();
				navigateToSection('first');
				break;
			case 'End':
				event.preventDefault();
				navigateToSection('last');
				break;
			case 'Escape':
				event.preventDefault();
				if (onClose) {
					onClose();
				}
				break;
		}
	}

	onMount(() => {
		// Add keyboard event listener
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		// Clean up event listener
		window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div
	class="project-card"
	role="region"
	aria-label="Project documentation viewer"
>
	<div class="card-header">
		<h2>{projectName}</h2>
		<div class="project-id">{projectId}</div>
		<div class="keyboard-hints">
			<span class="hint">↑↓ or j/k: Navigate</span>
			<span class="hint">Home/End: First/Last</span>
			{#if onClose}<span class="hint">Esc: Close</span>{/if}
		</div>
	</div>

	<div class="card-body">
		<Sidebar {sections} {activeSection} on:sectionChange={(e) => handleSectionChange(e.detail)} />

		<div class="content-area" role="main" aria-label="Documentation content">
			{#if loading}
				<div class="loading-skeleton-container">
					<LoadingSkeleton type="header" />
					<LoadingSkeleton type="card" />
					<LoadingSkeleton type="card" />
					<LoadingSkeleton type="table" rows={5} />
				</div>
			{:else if activeSection === 'overview'}
				<OverviewTab overview={documentation?.overview} />
			{:else if activeSection === 'A'}
				<SectionA data={documentation?.A} />
			{:else if activeSection === 'B'}
				<SectionB data={documentation?.B} />
			{:else if activeSection === 'C'}
				<SectionC data={documentation?.C} />
			{:else if activeSection === 'D'}
				<SectionD data={documentation?.D} />
			{:else if activeSection === 'E'}
				<SectionE data={documentation?.E} />
			{:else if activeSection === 'F'}
				<SectionF data={documentation?.F} />
			{:else if activeSection === 'G'}
				<SectionG data={documentation?.G} />
			{:else if activeSection === 'H'}
				<SectionH data={documentation?.H} />
			{:else if activeSection === 'I'}
				<SectionI data={documentation?.I} />
			{:else if activeSection === 'J'}
				<SectionJ data={documentation?.J} />
			{:else if activeSection === 'K'}
				<SectionK data={documentation?.K} />
			{:else if activeSection === 'L'}
				<SectionL data={documentation?.L} />
			{:else if activeSection === 'M'}
				<SectionM data={documentation?.M} />
			{/if}
		</div>
	</div>
</div>

<style>
	.project-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
		max-height: 90vh;
		outline: none;
	}

	.project-card:focus {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(102, 126, 234, 0.4);
	}

	.card-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.card-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.project-id {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		opacity: 0.8;
		font-family: 'Courier New', monospace;
	}

	.keyboard-hints {
		margin-top: 0.75rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hint {
		font-size: 0.75rem;
		background: rgba(255, 255, 255, 0.15);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		opacity: 0.9;
	}

	.card-body {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.content-area {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
		background: #f9fafb;
	}

	.loading-skeleton-container {
		max-width: 1000px;
		margin: 0 auto;
	}

	/* Mobile responsive design */
	@media (max-width: 768px) {
		.project-card {
			max-height: 100vh;
			border-radius: 0;
		}

		.card-header {
			padding: 1rem 1.5rem;
		}

		.card-header h2 {
			font-size: 1.25rem;
		}

		.project-id {
			font-size: 0.75rem;
		}

		.keyboard-hints {
			display: none; /* Hide keyboard hints on mobile */
		}

		.card-body {
			flex-direction: column;
		}

		.content-area {
			padding: 1rem;
		}

		.loading-skeleton-container {
			padding: 0;
		}
	}

	@media (max-width: 480px) {
		.card-header {
			padding: 0.75rem 1rem;
		}

		.card-header h2 {
			font-size: 1.125rem;
		}

		.content-area {
			padding: 0.75rem;
		}
	}
</style>

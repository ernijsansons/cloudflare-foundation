<script lang="ts">
	import type { SectionI } from '$lib/shared';
	export let data: SectionI | undefined;
</script>

<div class="section-i">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">🎯</div>
			<h3>No Brand Data</h3>
			<p>Section I will be populated during content engine phase.</p>
		</div>
	{:else}
		<!-- Naming Framework -->
		{#if data.naming_framework}
			<section class="subsection">
				<h2>Naming Framework</h2>
				<div class="card">
					<div class="field">
						<strong>Naming Approach:</strong>
						{data.naming_framework.naming_approach}
					</div>
					{#if data.naming_framework.finalist_names && data.naming_framework.finalist_names.length > 0}
						<div class="field">
							<strong>Finalist Names:</strong>
							<ul class="name-list">
								{#each data.naming_framework.finalist_names as name}
									<li>{name}</li>
								{/each}
							</ul>
						</div>
					{/if}
					<div class="field">
						<strong>Selected Name:</strong>
						<span class="selected-name">{data.naming_framework.selected_name}</span>
					</div>
					<div class="field">
						<strong>Rationale:</strong>
						{data.naming_framework.rationale}
					</div>
				</div>
			</section>
		{/if}

		<!-- Domain & Handles -->
		{#if data.domain_handles}
			<section class="subsection">
				<h2>Domain & Social Handles</h2>
				<div class="card">
					<div class="field">
						<strong>Domain:</strong>
						<a
							href="https://{data.domain_handles.domain}"
							target="_blank"
							rel="noopener noreferrer"
							class="domain-link">{data.domain_handles.domain}</a
						>
					</div>
					{#if data.domain_handles.social_handles && data.domain_handles.social_handles.length > 0}
						<div class="field">
							<strong>Social Handles:</strong>
							<div class="social-handles">
								{#each data.domain_handles.social_handles as handle}
									<span class="handle-badge">{handle}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Visual Identity -->
		{#if data.visual_identity}
			<section class="subsection">
				<h2>Visual Identity</h2>
				<div class="card">
					{#if data.visual_identity.color_palette && data.visual_identity.color_palette.length > 0}
						<div class="field">
							<strong>Color Palette:</strong>
							<div class="color-palette">
								{#each data.visual_identity.color_palette as color}
									<div class="color-swatch" style="background-color: {color};" title={color}>
										<span class="color-label">{color}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
					<div class="field">
						<strong>Typography:</strong>
						{data.visual_identity.typography}
					</div>
					{#if data.visual_identity.logo_concept}
						<div class="field">
							<strong>Logo Concept:</strong>
							{data.visual_identity.logo_concept}
						</div>
					{/if}
					{#if data.visual_identity.brand_voice}
						<div class="field">
							<strong>Brand Voice:</strong>
							{data.visual_identity.brand_voice}
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Content Templates -->
		{#if data.content_templates && data.content_templates.length > 0}
			<section class="subsection">
				<h2>Content Templates</h2>
				{#each data.content_templates as template}
					<div class="card template-card">
						<h3>{template.template_name}</h3>
						<div class="field">
							<strong>Purpose:</strong>
							{template.purpose}
						</div>
						<div class="field">
							<strong>Structure:</strong>
							{template.structure}
						</div>
					</div>
				{/each}
			</section>
		{/if}
	{/if}
</div>

<style>
	.section-i {
		max-width: 1000px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #6b7280;
	}
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #111827;
	}

	.subsection {
		margin-bottom: 2rem;
	}
	.subsection h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #667eea;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.field {
		margin-bottom: 1rem;
	}
	.field strong {
		color: #374151;
		font-weight: 600;
	}

	.selected-name {
		color: #667eea;
		font-weight: 600;
		font-size: 1.125rem;
	}

	.name-list {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0 0;
	}
	.name-list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #e5e7eb;
	}
	.name-list li:last-child {
		border-bottom: none;
	}

	.domain-link {
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
	}
	.domain-link:hover {
		text-decoration: underline;
	}

	.social-handles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	.handle-badge {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.color-palette {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
	.color-swatch {
		width: 100px;
		height: 60px;
		border-radius: 8px;
		display: flex;
		align-items: flex-end;
		padding: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}
	.color-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		background: rgba(0, 0, 0, 0.3);
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
	}

	.template-card {
		margin-bottom: 1rem;
	}
	.template-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		color: #111827;
	}
</style>

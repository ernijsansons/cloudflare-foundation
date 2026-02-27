/**
 * Renderer Registry
 *
 * Central registry for phase-specific renderers.
 * Maps PhaseName to PhaseRenderer implementations.
 *
 * Each renderer knows how to:
 * 1. Display the phase artifact (Svelte component)
 * 2. Extract structured data (takeaways, decisions, unknowns, evidence)
 */

import type { PhaseName } from '$lib/types';
import type { PhaseRenderer } from '$lib/utils/phase-normalizer';
import { GenericRenderer } from '$lib/utils/phase-normalizer';
import { OpportunityRenderer } from './extractors/opportunity-extractor';

// Svelte component imports
import OpportunityRendererComponent from './OpportunityRenderer.svelte';
import type { Component } from 'svelte';

/**
 * Registry entry containing both the renderer and component.
 */
interface RendererRegistryEntry {
  /**
   * Extraction logic (implements PhaseRenderer interface)
   */
  renderer: PhaseRenderer;

  /**
   * Svelte component for rendering the artifact
   */
  component?: Component;
}

/**
 * Default generic renderer instance.
 * Used for phases without custom renderers.
 */
const defaultRenderer = new GenericRenderer();

/**
 * Phase renderer registry.
 * Maps phase names to their renderer implementations.
 *
 * To add a new renderer:
 * 1. Create extractor class (e.g., extractors/customer-intel-extractor.ts)
 * 2. Create Svelte component (e.g., CustomerIntelRenderer.svelte)
 * 3. Register here
 */
const RENDERERS: Partial<Record<PhaseName, RendererRegistryEntry>> = {
  opportunity: {
    renderer: new OpportunityRenderer(),
    component: OpportunityRendererComponent,
  },

  // TODO: Add more renderers as they are implemented
  // 'customer-intel': {
  //   renderer: new CustomerIntelRenderer(),
  //   component: CustomerIntelRendererComponent,
  // },
  // 'market-research': {
  //   renderer: new MarketResearchRenderer(),
  //   component: MarketResearchRendererComponent,
  // },
  // ...
};

/**
 * Gets the renderer for a specific phase.
 * Falls back to generic renderer if no specific renderer exists.
 *
 * @param phase - Phase name
 * @returns PhaseRenderer instance
 */
export function getRendererForPhase(phase: PhaseName): PhaseRenderer {
  const entry = RENDERERS[phase];
  return entry?.renderer ?? defaultRenderer;
}

/**
 * Gets the Svelte component for rendering a phase's artifact.
 * Returns undefined if no custom component exists (use generic JSON viewer).
 *
 * @param phase - Phase name
 * @returns Svelte component or undefined
 */
export function getRendererComponentForPhase(phase: PhaseName): Component | undefined {
  const entry = RENDERERS[phase];
  return entry?.component;
}

/**
 * Checks if a phase has a custom renderer.
 *
 * @param phase - Phase name
 * @returns True if custom renderer exists
 */
export function hasCustomRenderer(phase: PhaseName): boolean {
  return phase in RENDERERS;
}

/**
 * Gets all registered phase names.
 *
 * @returns Array of phase names with custom renderers
 */
export function getRegisteredPhases(): PhaseName[] {
  return Object.keys(RENDERERS) as PhaseName[];
}

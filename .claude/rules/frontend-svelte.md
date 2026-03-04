---
paths:
  - "services/ui/**"
  - "**/*.svelte"
---

# Frontend Rules (SvelteKit)

## Framework
- SvelteKit with TypeScript
- @sveltejs/adapter-cloudflare for Workers deployment
- Tailwind CSS v4 for styling
- shadcn/ui components (copy-paste, not npm)

## Component Patterns (Svelte 5)
- Use $props() rune for component props
- Use $state() for reactive state
- Use $derived() for computed values
- Prefer +page.server.ts for data loading

## Styling
- Tailwind utility classes only
- Mobile-first responsive design
- CSS variables for theming
- Motion (Framer Motion) for animations

## Data Fetching
- All API calls through gateway proxy
- Handle loading and error states explicitly
- Use SvelteKit load functions, not client-side fetch

## Performance
- Lazy load heavy components
- Optimize images via CF Images
- Keep bundle size minimal

## Accessibility
- Keyboard accessible interactions
- Proper ARIA labels
- WCAG AA color contrast

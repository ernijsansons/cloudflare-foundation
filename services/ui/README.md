# UI Service

SvelteKit frontend for Cloudflare Foundation v2.5. Deployed to Cloudflare Pages with SSR.

## Overview

- **Framework:** SvelteKit 2.x with Svelte 5
- **Adapter:** @sveltejs/adapter-cloudflare
- **Styling:** CSS custom properties (design tokens)
- **State:** Svelte 5 runes ($state, $derived)

## Route Structure

```
src/routes/
├── +layout.svelte           # Root layout (AppShell)
├── +page.svelte              # Home page
├── +page.server.ts           # Home data loading
│
├── ai-labs/
│   ├── +layout.svelte        # AI Labs layout (SubNav)
│   ├── idea/                 # Create new idea
│   ├── research/             # Research runs
│   │   └── runs/[id]/        # Run detail view
│   ├── production/           # Production Kanban
│   └── parked-ideas/         # Parked ideas list
│
├── portfolio/                # Portfolio grid view
├── chat/                     # Chat interface
├── agents/                   # Agent management
├── dashboard/                # Dashboard views
│
└── api/[...path]/            # API proxy (dev mode)
    └── +server.ts
```

## Components

```
src/lib/components/
├── AppShell.svelte           # Main layout wrapper
├── Sidebar.svelte            # Navigation sidebar
├── TopBar.svelte             # Header bar
├── SubNav.svelte             # Section sub-navigation
│
├── Kanban.svelte             # Kanban board container
├── KanbanColumn.svelte       # Kanban column
├── KanbanCard.svelte         # Kanban card item
│
├── Badge.svelte              # Status/label badge
├── ArtifactViewer.svelte     # JSON artifact display
├── PhaseTimeline.svelte      # Phase progress timeline
├── PhaseDetail.svelte        # Phase details panel
├── CardDetailPanel.svelte    # Slide-out detail panel
└── CreateModal.svelte        # Create/edit modal
```

## Design Tokens

Defined in `src/app.css`:

```css
:root {
  /* Colors */
  --color-bg: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
  --color-border: #27272a;
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  /* Spacing */
  --sidebar-width: 240px;
  --topbar-height: 56px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
}
```

## Data Loading Pattern

Server-side data loading with service bindings:

```typescript
// +page.server.ts
import type { PageServerLoad } from "./$types";
import { dev } from "$app/environment";

export const load: PageServerLoad = async ({ platform }) => {
  let res: Response;

  if (dev) {
    // Development: direct fetch
    res = await fetch("http://127.0.0.1:8787/api/planning/runs");
  } else if (platform?.env?.GATEWAY) {
    // Production: service binding
    res = await platform.env.GATEWAY.fetch("https://_/api/planning/runs");
  } else {
    return { runs: [], error: "Gateway not configured" };
  }

  const data = await res.json();
  return { runs: data.items ?? [] };
};
```

## Svelte 5 Runes

Using Svelte 5 reactive primitives:

```svelte
<script lang="ts">
  import { page } from "$app/stores";

  // Derived from page data
  const data = $derived($page.data as PageData);

  // Computed values
  const filtered = $derived(
    data.items.filter(item => item.status === "active")
  );
</script>
```

## Local Development

```bash
# From project root
pnpm run dev

# UI runs at http://127.0.0.1:5173
# Hot reload enabled
```

## Building

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Adding a Page

1. Create route folder: `src/routes/my-page/`
2. Add server loader: `+page.server.ts`
3. Add component: `+page.svelte`
4. Add to navigation in `Sidebar.svelte` if needed

See [EXTENDING.md](../../docs/EXTENDING.md) for detailed guide.

## Type Definitions

```
src/lib/types/
└── index.ts              # Shared type definitions
    - PlanningRun
    - PlanningArtifact
    - ParkedIdea
    - KanbanCard
    - KanbanColumn
    - PhaseName
    - RunStatus
```

## Environment

In production, the UI needs these bindings in `wrangler.toml`:

```toml
[[services]]
binding = "GATEWAY"
service = "foundation-gateway"
```

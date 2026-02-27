# Bundle Optimization Guide

This document describes the bundle optimization strategy for the Foundation UI service.

## Current Optimizations

### 1. Code Splitting

**Vendor Chunks**: Dependencies are split into separate chunks for better caching:
- `vendor-svelte.js` - SvelteKit and Svelte core
- `vendor-drizzle.js` - Drizzle ORM
- `vendor.js` - All other node_modules

**Component Chunks**: Section components (A-M) are bundled together in `sections.js` for lazy loading.

### 2. Build Configuration

- **Target**: ES2020 for modern browsers (smaller bundles)
- **Minification**: esbuild (fast and efficient)
- **CSS Minification**: Enabled
- **Tree Shaking**: Automatic via Vite/Rollup

### 3. Asset Optimization

**File Naming**:
- `chunks/[name]-[hash].js` - Content-based hashing for cache busting
- `assets/[name]-[hash][extname]` - All static assets

**Chunk Size Limit**: 500 KB warning threshold

## Bundle Analysis

### Run Bundle Analysis

```bash
cd services/ui
pnpm build
pnpm run build -- --mode=analyze
```

### View Bundle Stats

After build, check the output:

```
dist/
├── chunks/
│   ├── vendor-svelte-abc123.js    (~150 KB)
│   ├── vendor-drizzle-def456.js   (~80 KB)
│   ├── vendor-ghi789.js           (~120 KB)
│   └── sections-jkl012.js         (~200 KB)
├── entries/
│   └── client-mno345.js           (~50 KB)
└── assets/
    └── styles-pqr678.css          (~30 KB)
```

## Optimization Checklist

### Frontend Optimizations

- [x] Code splitting by vendor and component
- [x] Tree shaking enabled
- [x] CSS minification
- [x] ES2020 target for modern browsers
- [x] Content-based hashing for cache busting
- [ ] Image optimization (if images added)
- [ ] Font subsetting (if custom fonts added)
- [ ] Lazy loading for routes

### Performance Best Practices

**Component-Level**:
- Use `{#if}` blocks to conditionally render heavy components
- Lazy load section components only when needed
- Avoid large inline data (use API calls instead)
- Use lightweight icons (Unicode/emoji vs SVG libraries)

**Data Fetching**:
- Enable HTTP/2 push for critical resources
- Use KV caching for API responses
- Implement stale-while-revalidate strategy
- Minimize API payload sizes

**CSS**:
- Component-scoped styles (no global bloat)
- Avoid unused CSS frameworks
- Use CSS variables for theming
- Minimize complex selectors

## Bundle Size Targets

### Production Targets

- **Initial JS**: < 200 KB (gzipped)
- **Vendor Chunks**: < 150 KB each (gzipped)
- **CSS**: < 50 KB (gzipped)
- **Total Page Load**: < 500 KB (gzipped)

### Lighthouse Performance

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 300ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Monitoring Bundle Size

### CI/CD Integration

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Build and analyze bundle
  run: |
    cd services/ui
    pnpm build
    pnpm run analyze-bundle

- name: Check bundle size
  run: |
    # Fail if any chunk exceeds 500 KB
    find services/ui/dist -name "*.js" -size +500k
```

### Local Monitoring

Use the bundle size checker script:

```bash
# Check current bundle sizes
./scripts/check-bundle-size.sh

# Compare with previous build
./scripts/check-bundle-size.sh --compare
```

## Advanced Optimizations

### Dynamic Imports

For rarely-used features, use dynamic imports:

```typescript
// Before (always loaded)
import HeavyComponent from './HeavyComponent.svelte';

// After (loaded on demand)
const HeavyComponent = () => import('./HeavyComponent.svelte');
```

### Route-Based Splitting

SvelteKit automatically splits by route. Ensure each route is lean:

```
routes/
├── +page.svelte           (< 50 KB)
├── ai-labs/
│   └── production/
│       └── +page.svelte   (< 100 KB - loads sections dynamically)
```

### Preloading Critical Resources

Add to `app.html`:

```html
<link rel="preload" href="/chunks/vendor-svelte.js" as="script">
<link rel="preload" href="/assets/styles.css" as="style">
```

### HTTP/2 Server Push

Configure in `wrangler.toml`:

```toml
[site]
bucket = "./dist"

[[site.http2]]
file = "/chunks/vendor-svelte.js"
```

## Debugging Large Bundles

### Find Large Dependencies

```bash
# List largest dependencies
pnpm list --depth=0 --json | jq '.dependencies | to_entries | map({key: .key, size: .value.size}) | sort_by(.size) | reverse | .[0:10]'
```

### Analyze Import Chains

Use `vite-bundle-visualizer`:

```bash
pnpm add -D vite-bundle-visualizer
pnpm build
pnpm run analyze
```

### Remove Unused Code

```bash
# Find unused exports
pnpm add -D ts-prune
pnpm ts-prune
```

## Resources

- [Vite Performance Optimization](https://vitejs.dev/guide/performance.html)
- [SvelteKit Packaging](https://kit.svelte.dev/docs/packaging)
- [Web.dev Bundle Size](https://web.dev/your-first-performance-budget/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

# Planning Machine — Bridge

Bridges Planning Machine output to Foundation project scaffold.

## Usage

### CLI (recommended)

```bash
# Build the CLI first
pnpm run build:plan

# Init a new project
npx foundation-plan init "your product idea"

# Validate planning artifacts
npx foundation-plan validate path/to/planning

# Scaffold Foundation project
npx foundation-plan scaffold --from path/to/planning -o path/to/output
```

### Direct script

```bash
npx tsx planning-machine/scripts/bootstrap-foundation.ts <planning-dir> [project-dir]
```

**Important:** Run scaffold to a directory *outside* the foundation repo (e.g. `c:\dev\future-idea\`) to avoid recursive copy.

## Inputs

`planning/` must contain:

- `BOOTSTRAP.md` — steps, service name
- `DATA_MODEL.md` — entity-storage map (markdown table or YAML)
- `PRODUCT_ARCHITECTURE.md` (optional) — service names, D1 names
- `EXECUTION_RULES.md` (optional) — product-specific rules

## Example

```bash
npx foundation-plan scaffold --from planning-machine/fixtures/planning -o c:\dev\future-idea
```

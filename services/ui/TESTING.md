# Testing Guide - Foundation UI

This document describes the testing setup and how to run tests for the Foundation UI service.

## Testing Stack

- **Test Runner**: Vitest
- **Component Testing**: @testing-library/svelte
- **Assertions**: Vitest + @testing-library/jest-dom
- **Coverage**: @vitest/coverage-v8

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test -- --watch
```

### Run tests with UI
```bash
pnpm test:ui
```

### Run tests with coverage
```bash
pnpm test:coverage
```

## Coverage Reports

Coverage is configured to generate three types of reports:

1. **Text**: Displayed in terminal after running `pnpm test:coverage`
2. **JSON**: Generated at `coverage/coverage-final.json`
3. **HTML**: Generated at `coverage/index.html` - Open this in a browser for detailed coverage visualization

### Coverage Thresholds

The project enforces the following minimum coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Tests will fail if coverage drops below these thresholds.

## Test Structure

Tests are co-located with components:

```
src/lib/components/ProjectCard/
├── Sidebar.svelte
├── Sidebar.test.ts
├── LoadingSkeleton.svelte
├── LoadingSkeleton.test.ts
├── SectionA.svelte
└── SectionA.test.ts
```

## Writing Tests

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(MyComponent, {
      props: { message: 'Hello' }
    });

    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing Events

```typescript
import { fireEvent } from '@testing-library/svelte';

it('emits event on click', async () => {
  const { component, getByRole } = render(MyComponent);
  const handleClick = vi.fn();

  component.$on('click', handleClick);

  await fireEvent.click(getByRole('button'));

  expect(handleClick).toHaveBeenCalled();
});
```

### Testing Accessibility

```typescript
it('has proper accessibility attributes', () => {
  const { getByRole } = render(MyComponent);

  expect(getByRole('button')).toHaveAttribute('aria-label', 'Close');
});
```

## Coverage Goals

Current test coverage:

- **Sidebar.svelte**: ✅ Fully tested
- **LoadingSkeleton.svelte**: ✅ Fully tested
- **SectionA.svelte**: ✅ Fully tested

To achieve 80% overall coverage, tests should be added for:

- ProjectCard.svelte
- OverviewTab.svelte
- Sections B-M
- Utility functions

## CI/CD Integration

Tests run automatically in CI/CD pipelines:

```bash
# In CI
pnpm test:coverage

# This will:
# 1. Run all tests
# 2. Generate coverage reports
# 3. Fail if coverage < 80%
```

## Troubleshooting

### Tests fail with module resolution errors

Ensure you've run `pnpm install` to install all dependencies:

```bash
pnpm install
```

### Coverage reports not generated

Make sure you're using the coverage script:

```bash
pnpm test:coverage
```

Not just:

```bash
pnpm test
```

### Svelte component tests fail

Ensure your vitest.config.ts includes the Svelte plugin:

```typescript
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })]
});
```

## Best Practices

1. **Test user behavior, not implementation**: Focus on what users see and do, not internal component state
2. **Use accessibility queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep tests simple**: One assertion per test when possible
4. **Mock external dependencies**: Mock API calls, database queries, etc.
5. **Test edge cases**: Empty states, error states, loading states

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

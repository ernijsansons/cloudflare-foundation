# Testing Strategy

## Overview

Comprehensive test suite for the Palantir AIP-inspired architecture, covering unit tests, integration tests, and validation tests.

## Test Coverage

### Phase 2 Test Suite (147 tests passing)

| Component | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| **RBAC System** | 34 | ✅ Passing | Permission checks, role hierarchy, middleware |
| **Quality Scorer** | 22 | ✅ Passing | 5 dimensions, scoring algorithm, quality tiers |
| **Schema Validator** | 33 | ✅ Passing | All 17 phases, validation errors, edge cases |
| **Operator Reviews** | 15 | ✅ Passing | Review creation, statistics, validation |
| **Escalations** | 20 | ✅ Passing | Priority levels, status workflow, SLA tracking |
| **Audit Logger** | 23 | ✅ Passing | Log structure, filtering, statistics, integrity |
| **Total** | **147** | **✅ All Passing** | **Comprehensive coverage** |

## Test Structure

```
services/planning-machine/src/lib/__tests__/
├── rbac.test.ts                      (34 tests)
├── quality-scorer.test.ts            (22 tests)
├── schema-validator.test.ts          (33 tests)
├── operator-reviews.test.ts          (15 tests)
├── escalations.test.ts               (20 tests)
└── audit-logger.test.ts              (23 tests)
```

## Running Tests

### Run All Tests
```bash
cd services/planning-machine
npm test
```

### Run Specific Test Suite
```bash
npm test -- rbac.test.ts
npm test -- quality-scorer.test.ts
npm test -- schema-validator.test.ts
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation

**Examples**:
- RBAC permission checking
- Quality score calculations
- Schema validation logic

**Pattern**:
```typescript
describe('Component Name', () => {
  describe('Function Name', () => {
    it('should do expected behavior', () => {
      const result = functionUnderTest(input);
      expect(result).toBe(expectedValue);
    });
  });
});
```

### 2. Integration Tests

**Purpose**: Test interactions between components

**Examples**:
- Operator review creation with audit logging
- Quality scoring with schema validation
- RBAC checks with database operations

**Pattern**:
```typescript
describe('Integration: Feature Name', () => {
  beforeEach(async () => {
    // Setup test database, mocks, etc.
  });

  it('should complete full workflow', async () => {
    // Test multi-component interaction
  });
});
```

### 3. Validation Tests

**Purpose**: Ensure data integrity and business rules

**Examples**:
- Confidence score ranges (0-100)
- Required field presence
- Enum value validation

**Pattern**:
```typescript
describe('Validation: Entity Name', () => {
  it('should reject invalid data', () => {
    expect(() => validate(invalidData)).toThrow();
  });

  it('should accept valid data', () => {
    expect(() => validate(validData)).not.toThrow();
  });
});
```

## Test Best Practices

### 1. Descriptive Test Names
```typescript
// ✅ Good
it('should deny operator from creating users')

// ❌ Bad
it('test permission check')
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should calculate average confidence correctly', () => {
  // Arrange
  const reviews = [
    { confidence: 85 },
    { confidence: 90 },
    { confidence: 75 },
  ];

  // Act
  const avg = calculateAverage(reviews);

  // Assert
  expect(avg).toBe(83.33);
});
```

### 3. Test Edge Cases
```typescript
describe('Confidence Score Validation', () => {
  it('should accept minimum value (0)', () => {
    expect(isValidConfidence(0)).toBe(true);
  });

  it('should accept maximum value (100)', () => {
    expect(isValidConfidence(100)).toBe(true);
  });

  it('should reject negative values', () => {
    expect(isValidConfidence(-1)).toBe(false);
  });

  it('should reject values over 100', () => {
    expect(isValidConfidence(101)).toBe(false);
  });
});
```

### 4. Use Test Fixtures
```typescript
// fixtures/users.ts
export const operatorUser: UserWithRole = {
  id: 'user-op-001',
  tenantId: 'tenant-001',
  email: 'operator@example.com',
  name: 'Test Operator',
  role: 'operator',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// In tests
import { operatorUser } from './fixtures/users';
```

### 5. Mock External Dependencies
```typescript
// Mock database
const mockDb = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      run: vi.fn(),
      first: vi.fn(),
      all: vi.fn(),
    })),
  })),
};
```

## RBAC Tests (34 tests)

### Coverage

- ✅ Permission checking for all roles
- ✅ Cross-tenant access denial
- ✅ Role hierarchy validation
- ✅ Permission inheritance
- ✅ Middleware functions
- ✅ Error handling

### Key Tests

```typescript
// Permission checking
it('should allow operator to approve decisions')
it('should deny operator from creating users')
it('should allow supervisor to override quality scores')
it('should allow admin to configure system')

// Role hierarchy
it('should show admin has most permissions')
it('should show operator has subset of supervisor permissions')

// Tenant isolation
it('should deny cross-tenant access')
```

## Quality Scorer Tests (22 tests)

### Coverage

- ✅ All 5 dimensions (evidence, accuracy, completeness, citations, reasoning)
- ✅ Weighted average calculation
- ✅ Quality tiers (excellent, good, acceptable, poor, critical)
- ✅ Production quality threshold (85+)
- ✅ Schema validation integration
- ✅ Consensus-based accuracy scoring

### Key Tests

```typescript
// Dimensional scoring
it('should penalize missing citations')
it('should detect low consensus and flag hallucination risk')
it('should reward high consensus')
it('should validate completeness against schema')

// Overall scoring
it('should score high-quality artifact highly')
it('should score low-quality artifact poorly')
```

## Schema Validator Tests (33 tests)

### Coverage

- ✅ All 17 phase schemas
- ✅ Required field validation
- ✅ Type checking
- ✅ Custom validation rules
- ✅ Error message clarity

### Key Tests

```typescript
// Phase validation
it('should validate intake phase output')
it('should validate kill-test phase output')
it('should validate strategy phase output')

// Error handling
it('should detect missing required fields')
it('should provide clear error messages')
```

## Operator Reviews Tests (15 tests)

### Coverage

- ✅ Review creation with all actions (approve, reject, revise, escalate)
- ✅ Confidence score validation (0-100)
- ✅ Review statistics (approval rate, average confidence)
- ✅ Filtering and querying

### Key Tests

```typescript
// Review actions
it('should create review with valid data')
it('should require revision instructions for revise action')

// Statistics
it('should calculate approval rate correctly')
it('should calculate average confidence')
```

## Escalations Tests (20 tests)

### Coverage

- ✅ Priority levels (urgent, high, medium, low)
- ✅ Status workflow (pending → in_review → resolved/rejected)
- ✅ SLA tracking
- ✅ Assignment logic
- ✅ Resolution time calculation

### Key Tests

```typescript
// Priority management
it('should order priorities correctly')
it('should have appropriate SLAs by priority')

// Workflow
it('should follow valid status workflow')
it('should transition to in_review when assigned')

// Statistics
it('should identify SLA violations')
it('should calculate average resolution time')
```

## Audit Logger Tests (23 tests)

### Coverage

- ✅ Log entry structure
- ✅ Action type validation
- ✅ Resource type validation
- ✅ Filtering by user, tenant, action, resource, time, success
- ✅ Statistics (total, success rate, action counts)
- ✅ Immutability (no updates/deletes)

### Key Tests

```typescript
// Structure
it('should have required fields')
it('should include metadata for context')
it('should capture error details for failures')

// Filtering
it('should filter by user')
it('should filter by time range')
it('should filter by success status')

// Integrity
it('should be immutable (no updates or deletes)')
it('should maintain chronological order')
```

## Continuous Integration

### GitHub Actions Workflow

Tests run automatically on:
- Every push to `develop` or `main`
- Every pull request
- Pre-deployment checks

### CI Configuration

```yaml
- name: Run Tests
  run: |
    cd services/planning-machine
    npm test

- name: Check Coverage
  run: |
    cd services/planning-machine
    npm test -- --coverage
    # Fail if coverage < 80%
```

## Test Metrics

### Current Status

- **Total Tests**: 147
- **Passing**: 147 (100%)
- **Coverage**: High (all core components)
- **Performance**: Fast (<3 seconds for full suite)

### Quality Gates

- ✅ All tests must pass before merge
- ✅ Code coverage > 80% for new code
- ✅ No skipped tests in CI
- ✅ Test execution time < 5 seconds

## Future Testing Improvements

### Phase 3 Enhancements

1. **E2E Tests** - Full workflow tests from decision creation to resolution
2. **Performance Tests** - Load testing with large datasets
3. **Integration Tests** - Test with real D1 database
4. **Contract Tests** - API contract validation
5. **Mutation Testing** - Test quality validation with mutation testing

### Planned Additions

- [ ] Visual regression tests for UI components
- [ ] API response time benchmarks
- [ ] Stress testing for concurrent operations
- [ ] Security testing (injection, XSS, etc.)
- [ ] Accessibility testing for operator UIs

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "db.prepare is not a function"
**Solution**: Mock the database properly in test setup

**Issue**: Tests timeout
**Solution**: Increase timeout in vitest.config.ts or optimize test

**Issue**: Flaky tests
**Solution**: Remove dependencies on timing, use proper async/await

### Debug Mode

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run single test
npm test -- -t "should allow operator to approve decisions"

# Debug in VS Code
# Add breakpoint, run "Vitest: Debug" from command palette
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](./TESTING_BEST_PRACTICES.md)
- [CI/CD Pipeline](./CI_CD.md)

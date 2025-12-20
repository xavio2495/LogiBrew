# LogiBrew Testing Documentation

## Test Suite Overview

LogiBrew uses **Jest v30.2.0** for unit testing with full ESM module support. The test suite validates core business logic functions that are critical for logistics compliance and decision-making.

### Test Coverage Summary

| File | Statements | Branches | Functions | Lines | Focus Area |
|------|-----------|----------|-----------|-------|------------|
| **hashChain.js** | 53.33% | 66.66% | 66.66% | 51.72% | Security-critical hash chain integrity |
| **index.js** | 29.09% | 35.97% | 17.5% | 29.33% | Core backend functions |
| **Global** | 30.84% | 37.24% | 20.93% | 30.94% | Overall codebase |

**Total Tests**: 85 passing  
**Test Files**: 3 comprehensive suites  
**Test Execution Time**: ~3-7 seconds

## Test Files

### 1. validateCompliance.test.js (34 tests)

**Purpose**: Validates shipment compliance against embedded regulatory rules.

**Coverage Areas**:
- ✅ Input validation (null/undefined/invalid payloads)
- ✅ UN code format validation (UNXXXX pattern)
- ✅ Transport mode validation (air/sea/road/rail)
- ✅ Cargo type validation (general/hazmat/perishable/temperature-controlled)
- ✅ Weight limit enforcement (0-1,000,000 kg)
- ✅ Hazmat restrictions (UN1203, UN1789, UN1845)
  - UN1203 (Gasoline): Passenger aircraft restrictions
  - UN1789 (Hydrochloric acid): Weight limits
  - UN1845 (Dry ice): Perishable cargo support
- ✅ Perishable goods warnings (temperature/transit time)
- ✅ Case sensitivity handling (uppercase/lowercase/mixed)

**Key Assertions**:
- `isValid` flag correctly identifies compliance issues
- `issues` array contains actionable error messages
- `warnings` array for non-blocking concerns (e.g., passenger aircraft restrictions)
- `recommendations` provide next steps for users
- `details` object includes rule references (class, packing group, restrictions)

**Example Test**:
```javascript
test('should flag UN1203 (Gasoline) as forbidden on passenger aircraft', async () => {
  const result = await validateCompliance({
    unCode: 'UN1203',
    transportMode: 'air',
    cargoType: 'hazmat',
    weight: 50
  });

  expect(result.isValid).toBe(true); // Still valid but with warning
  expect(result.warnings).toHaveLength(1);
  expect(result.warnings[0].type).toBe('PASSENGER_AIRCRAFT_RESTRICTION');
  expect(result.warnings[0].message).toContain('Cargo aircraft only');
});
```

### 2. calculateEmissions.test.js (30 tests)

**Purpose**: Validates carbon emission calculations and EU ETS compliance checks.

**Coverage Areas**:
- ✅ Input validation (missing origin/destination, invalid weights)
- ✅ Emission factor application by transport mode
  - Air: 0.5 kg CO2/ton-km
  - Sea: 0.01 kg CO2/ton-km
  - Road: 0.1 kg CO2/ton-km
  - Rail: 0.05 kg CO2/ton-km
- ✅ EU ETS threshold detection (>500kg CO2)
- ✅ Carbon offset recommendations (>1000kg CO2)
- ✅ Distance estimation vs. provided distance
- ✅ Transport mode comparisons (air vs. sea emissions)
- ✅ Edge cases (very small/large weights, short/long distances)
- ✅ Case sensitivity (uppercase/mixed case transport modes)

**Key Assertions**:
- `total` emissions calculated correctly ((weight/1000) * distance * factor)
- `compliance.euEts.exceeded` flag for threshold breaches
- `compliance.carbonOffset.recommended` for high emissions
- `recommendations` include actionable steps (reporting, offsets, mode switches)
- `breakdown` provides detailed calculation components

**Example Test**:
```javascript
test('should show air transport has higher emissions than sea', async () => {
  const airResult = await calculateEmissions({
    origin: 'Singapore',
    destination: 'Rotterdam',
    transportMode: 'air',
    weight: 5000,
    distance: 10000
  });

  const seaResult = await calculateEmissions({
    origin: 'Singapore',
    destination: 'Rotterdam',
    transportMode: 'sea',
    weight: 5000,
    distance: 10000
  });

  expect(airResult.emissions.total).toBeGreaterThan(seaResult.emissions.total);
  expect(airResult.emissions.total).toBe(25000); // Air: 50x higher
  expect(seaResult.emissions.total).toBe(500);
});
```

### 3. hashChain.test.js (21 tests)

**Purpose**: Validates cryptographic hash chain integrity (security-critical).

**Coverage Areas**:
- ✅ Hash generation determinism (same input = same hash)
- ✅ SHA-256 output validation (64 hex characters)
- ✅ Unique hashes for different inputs (timestamp, userId, decision)
- ✅ Genesis block handling (previousHash: "0")
- ✅ Chain integrity verification
  - Valid single-entry chains
  - Valid multi-entry chains
  - Broken previousHash links (tamper detection)
  - Tampered entry content (recalculation mismatch)
  - Tampered hash values
- ✅ Performance testing (100-entry chain <1s)
- ✅ Complex decision object handling
- ✅ Special character support in fields

**Key Assertions**:
- `generateHash()` produces deterministic SHA-256 hashes
- `verifyChain()` detects any tampering in chain
- Hash format: 64-character hexadecimal string
- Chain immutability: changing any entry breaks verification

**Example Test**:
```javascript
test('should detect tampered entry content', () => {
  const entry1 = {
    timestamp: 1000,
    action: 'approval',
    userId: 'user1',
    shipmentId: 'SHIP-001',
    decision: { status: 'approved' },
    previousHash: '0'
  };
  entry1.hash = generateHash(entry1);

  const entry2 = {
    timestamp: 2000,
    action: 'route_change',
    userId: 'user1',
    shipmentId: 'SHIP-001',
    decision: { route: 'new' },
    previousHash: entry1.hash
  };
  entry2.hash = generateHash(entry2);

  // Tamper with entry1's action AFTER hash was generated
  entry1.action = 'rejection';

  const chain = [entry1, entry2];
  const isValid = verifyChain(chain);

  expect(isValid).toBe(false); // Tampering detected
});
```

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run with watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Execution

Tests use **ESM modules** with Node.js experimental VM modules flag:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

**Note**: You'll see `ExperimentalWarning` messages - these are expected and safe to ignore.

### Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:
- **Terminal**: Text summary with file-level breakdown
- **coverage/lcov-report/index.html**: Interactive HTML report
- **coverage/lcov.info**: LCOV format for CI/CD integration

## What's Tested vs. What's Not

### ✅ Tested (Unit Tests)

**Core Business Logic**:
- `validateCompliance()` - Regulatory compliance checks
- `calculateEmissions()` - Carbon emission calculations
- `generateHash()` - SHA-256 hash generation
- `verifyChain()` - Hash chain integrity verification

These functions are **pure or near-pure** - they don't depend on Forge runtime context, making them ideal for unit testing.

### ⏳ Requires Integration Testing (Not in Unit Tests)

**Forge Resolvers** (lines 1169-1687 in index.js):
- `getMacroLogs` - Confluence macro backend
- `getDashboardMetrics` - Jira dashboard gadget backend
- `getJsmInsights` - JSM panel backend
- `getKnowledgeBase` - Confluence global page backend

**Reason**: Resolvers require Forge runtime context (`@forge/bridge`, `storage` API, `view.getContext()`). Testing requires deployed Forge environment or complex mocking.

**JSM Integration** (lines 784-935 in index.js):
- `createApprovalRequest()` - Service Desk API integration
- Auto-discovery of service desks and request types
- Issue linking and comment creation

**Reason**: Requires live Jira Service Management API with authenticated requests. Integration tests should be run in dev Atlassian environment.

**Workflow Handlers** (lines 635-780):
- `workflowValidator` - Pre-transition compliance checks
- `workflowPostFunction` - Post-transition log generation
- `issueCreatedHandler` - Real-time analysis trigger
- `issueUpdatedHandler` - Shipment data change tracking

**Reason**: Triggered by Jira workflow events. Testing requires actual workflow transitions in deployed app.

**UI Components** (src/dashboard/, src/macro/, src/jsm-panel/, src/knowledge-base/, src/shipment-panel/):
- All React components using `@forge/react`
- Frontend `invoke()` calls to resolvers
- UI Kit component rendering

**Reason**: Require browser/Forge iframe context. UI testing should use Forge's built-in preview or deployed environment testing.

## Coverage Strategy

### Current Approach: Focused Unit Testing

LogiBrew's test strategy prioritizes **high-value, high-risk functions**:

1. **Compliance Validation** (34 tests) - Regulatory errors could lead to fines/safety issues
2. **Emission Calculations** (30 tests) - EU ETS reporting requirements
3. **Hash Chain Integrity** (21 tests) - Audit trail validity for dispute resolution

**Why 30% global coverage is acceptable**:
- **70% of codebase** is Forge-specific (resolvers, UI, workflows)
- **Testing these requires integration tests** in deployed environment
- **30% coverage focuses on critical business logic** that's unit-testable
- **Higher file-level coverage** for security-critical code (hashChain.js: 53%)

### Future: Integration Testing Plan

For comprehensive testing of uncovered code:

1. **Forge Tunnel Testing**:
   - Use `forge tunnel` to test resolvers in local dev
   - Manually invoke UI components and verify outputs
   - Test workflow transitions in sandbox Jira

2. **End-to-End Scenarios**:
   - Create shipment issue → Verify compliance validation
   - Transition to "Pending Approval" → Verify JSM request created
   - Check Confluence macro → Verify log chain displayed

3. **Automated Integration Tests** (future):
   - Forge CLI test commands (when available)
   - Cypress/Playwright for UI testing
   - Postman collections for API integration tests

## Mock System

### Forge API Mocks

Located in `tests/__mocks__/`:

**forge-api.js**:
```javascript
export const storage = {
  get: async (key) => null,
  set: async (key, value) => {},
  delete: async (key) => {},
  query: () => ({ where: () => ({ getMany: async () => ({ results: [] }) }) })
};

export const fetch = async (url, options) => ({
  ok: true,
  json: async () => ({}),
  text: async () => ''
});
```

**forge-bridge.js**:
```javascript
export const invoke = async (functionName, payload) => ({ data: 'mock' });
export const view = { getContext: async () => ({ extension: {} }) };
export const requestJira = async (path, options) => ({ ok: true, json: async () => ({}) });
export const requestConfluence = async (path, options) => ({ ok: true, json: async () => ({}) });
```

**forge-resolver.js**:
```javascript
export default class Resolver {
  constructor() {
    this.definitions = {};
  }
  define(name, handler) {
    this.definitions[name] = handler;
  }
  getDefinitions() {
    return this.definitions;
  }
}
```

**Why simple async functions?**
- ESM modules require mocks at module level (before `jest.fn()` is available)
- Simple async functions sufficient for testing pure business logic
- Complex mocking (spies, matchers) can be added in individual test files if needed

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22.x'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Coverage Badge

Add to README.md:
```markdown
![Coverage](https://img.shields.io/codecov/c/github/your-org/logibrew)
```

## Troubleshooting

### Common Issues

**1. "jest is not defined" error**:
- **Cause**: Using `jest.fn()` at module level in ESM context
- **Fix**: Use simple async functions in mocks, add `jest.fn()` in test files if needed

**2. "Cannot find module" error**:
- **Cause**: Import path incorrect or file not in test directory
- **Fix**: Ensure all imported files are within `logibrew-x1/` directory, use relative paths from test file

**3. Tests passing but coverage failing**:
- **Cause**: Coverage thresholds too high for codebase with Forge-specific code
- **Fix**: Adjust thresholds in `jest.config.js` to reflect testable vs. integration-only code

**4. "ExperimentalWarning: VM Modules" messages**:
- **Cause**: Using `--experimental-vm-modules` flag for ESM support
- **Fix**: This is expected - warnings are safe to ignore

### Debugging Tests

**Enable verbose output**:
```bash
npm test -- --verbose
```

**Run single test file**:
```bash
npm test -- validateCompliance.test.js
```

**Run single test**:
```bash
npm test -- -t "should flag UN1203"
```

**Debug with Node inspector**:
```bash
node --inspect --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
```

## Best Practices

### Writing New Tests

1. **Follow Arrange-Act-Assert pattern**:
   ```javascript
   test('should validate shipment', async () => {
     // Arrange
     const input = { unCode: 'UN1203', transportMode: 'air' };
     
     // Act
     const result = await validateCompliance(input);
     
     // Assert
     expect(result.isValid).toBe(true);
   });
   ```

2. **Test edge cases first**:
   - Null/undefined inputs
   - Empty strings
   - Boundary values (0, max limits)
   - Invalid formats

3. **Use descriptive test names**:
   - Good: `should reject invalid UN code format - missing UN prefix`
   - Bad: `test UN code validation`

4. **Keep tests isolated**:
   - Don't rely on execution order
   - Don't share state between tests
   - Reset mocks if needed

5. **Test one thing per test**:
   - Each test should have a single assertion focus
   - Multiple `expect()` calls OK if testing same logical outcome

### Maintaining Coverage

**When adding new functions**:
1. Write tests BEFORE implementing (TDD)
2. Aim for 80%+ coverage on new unit-testable functions
3. Document if function requires integration testing instead

**When refactoring**:
1. Run tests before refactoring (ensure green)
2. Run tests after each small change
3. Coverage should not decrease

**When fixing bugs**:
1. Write failing test that reproduces bug
2. Fix code until test passes
3. Verify coverage didn't drop

## Performance Benchmarks

**Current Performance** (Node.js 22.21.1, ARM64):
- **Test Execution**: ~3-7 seconds for 85 tests
- **Coverage Generation**: ~6-8 seconds including report generation
- **Average Test**: ~35-80ms per test
- **Hash Chain (100 entries)**: <10ms (performance test passing)

**Acceptable Ranges**:
- Single test: <500ms
- Full suite: <30 seconds
- Coverage generation: <15 seconds

If tests slow down beyond these ranges, investigate:
- Heavy computations in test setup
- Unnecessary file I/O
- Complex mock setups
- Memory leaks in test code

## Contributing

When submitting PRs with code changes:

1. **Run full test suite**: `npm test`
2. **Check coverage**: `npm run test:coverage`
3. **Add tests for new functions** (if unit-testable)
4. **Document integration test requirements** (if not unit-testable)
5. **Update TESTING.md** if changing test strategy

---

**Last Updated**: December 21, 2025  
**Test Framework**: Jest v30.2.0  
**Node.js**: v22.21.1 (ARM64)  
**Coverage Tool**: Istanbul (via Jest)

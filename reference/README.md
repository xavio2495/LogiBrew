# LogiBrew Reference Code

This folder contains reusable code examples, utilities, and patterns for LogiBrew development.

## Files

### hashChain.js
Complete implementation of hash chain utilities for tamper-evident logging.

**Purpose**: Provides cryptographic verification for compliance decisions using SHA-256 hash chains.

**Key Functions**:
- `generateHash(record)` - Generate SHA-256 hash with chain linking
- `verifyChain(logChain)` - Verify chain integrity (detect tampering)
- `storeHashRoot(pageId, hashRoot, metadata)` - Store chain roots in Confluence
- `logComplianceDecision(decision)` - End-to-end logging workflow
- `getVerifiedChain(shipmentId)` - Retrieve and verify complete chains

**Usage**:
```javascript
import { logComplianceDecision } from '../reference/hashChain.js';

export async function complianceAction(payload) {
  const logEntry = await logComplianceDecision({
    action: 'compliance_check',
    userId: payload.userId,
    shipmentId: payload.shipmentId,
    outcome: { status: 'approved', unCode: 'UN1234' }
  });
  return { success: true, hash: logEntry.hash };
}
```

### mockApis.js
Mock external API responses for development and demo deployments.

**Purpose**: Simulate weather, port status, regulatory, and emission calculation APIs without real external dependencies.

**Key Functions**:
- `getWeatherData(location)` - Mock weather conditions
- `getPortStatus(portCode)` - Mock port congestion/delays
- `validateUnCode(unCode, transportMode)` - Mock UN code validation
- `calculateEmissions(shipment)` - Mock carbon emission calculations
- `apiSwitch(apiType, mockFn, realFn, ...args)` - Environment-aware switching
- `realWeatherApiCall(location)` - Example real API implementation

**Usage**:
```javascript
import { getWeatherData, apiSwitch } from '../reference/mockApis.js';

// Development: Use mock
const weather = await getWeatherData('Singapore');

// Production: Switch based on environment variable
const weather = await apiSwitch(
  'weather',
  getWeatherData,
  realWeatherApiCall,
  'Singapore'
);
```

**Switching to Real APIs**:
1. Add egress permissions to `manifest.yml`
2. Set API keys: `forge variables set --encrypt API_KEY <key>`
3. Set environment variable: `USE_REAL_APIS=true` in manifest
4. Redeploy with `--upgrade` flag
5. Implement real API function (see `realWeatherApiCall` example)

## Integration Patterns

### Importing Reference Code
Reference code should be imported into Forge functions (`src/index.js` or separate modules):

```javascript
// In src/index.js
import { 
  generateHash, 
  logComplianceDecision 
} from '../reference/hashChain.js';

import { 
  getWeatherData, 
  validateUnCode 
} from '../reference/mockApis.js';

// Use in Forge action handlers
export async function weatherCheckAction(payload) {
  const weather = await getWeatherData(payload.location);
  return { weather };
}

export async function logDecisionAction(payload) {
  const entry = await logComplianceDecision(payload);
  return { hash: entry.hash };
}
```

### Error Handling
Both utilities include error handling patterns:

```javascript
// Hash chain errors
try {
  const entry = await logComplianceDecision(decision);
} catch (error) {
  console.error(`Logging failed: ${error.message}`);
  // Handle gracefully
}

// API errors with fallback
try {
  const weather = await realWeatherApiCall(location);
} catch (error) {
  console.error(`Real API failed: ${error.message}`);
  // Automatic fallback to mock
  return await getWeatherData(location);
}
```

## Development Guidelines

### Code Style
- Verbose JSDoc comments for all functions
- Intermediate JavaScript developer friendly
- Idiomatic JavaScript (no TypeScript)
- Async/await for all I/O operations

### Testing Patterns
```javascript
// Test hash chain integrity
const chain = [
  await logComplianceDecision({ shipmentId: 'TEST-001', ... }),
  await logComplianceDecision({ shipmentId: 'TEST-001', ... }),
  await logComplianceDecision({ shipmentId: 'TEST-001', ... })
];

const { isValid, rootHash } = await getVerifiedChain('TEST-001');
console.log(`Chain valid: ${isValid}, Root: ${rootHash}`);

// Test mock APIs
const weather = await getWeatherData('Singapore');
console.log(`Weather: ${weather.conditions}, ${weather.temperature}°C`);
```

### Extending Reference Code
When adding new utilities:
1. Follow existing JSDoc patterns
2. Include usage examples in comments
3. Add error handling with fallbacks
4. Update this README with new functions
5. Document in `agent-docs/changelog.md`

## See Also
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) - AI agent guidance
- [agent-docs/changelog.md](../agent-docs/changelog.md) - Development log
- [Modules.md](../Modules.md) - Forge module reference

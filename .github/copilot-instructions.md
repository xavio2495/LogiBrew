# LogiBrew: AI Coding Agent Instructions

## Project Overview
LogiBrew is an Atlassian Forge app for logistics teams that provides AI-assisted disruption management and verifiable decision-making. The app creates a "Verifiable Adaptation Framework" using Rovo agents to analyze shipment data, generate compliance validations, and sync insights across Atlassian products (Jira, Confluence, JSM, Compass).

**Core Concept**: Transform logistics disruptions into opportunities through traceable, AI-driven insights with hash-verified audit logs that integrate seamlessly into team workflows.

**Current Implementation Status** (see [agent-docs/changelog.md](../agent-docs/changelog.md)):
- ✅ Phase 1-2 Complete: Rovo agent, compliance actions, workflow triggers, Confluence macros
- 🚧 Phase 3 In Progress: Dashboard gadgets, knowledge base, JSM panels
- 📋 Phase 4 Planned: Advanced features per [Modules.md](../Modules.md)

## 🔧 CRITICAL: Using Forge Knowledge MCP Server

**ALWAYS use the `forge-knowledge` MCP server** for:
- Getting information about Forge app development
- Understanding Forge modules, components, and APIs
- Troubleshooting build errors and deployment issues
- Resolving manifest.yml syntax problems
- Learning about Forge CLI commands and flags
- Understanding UI Kit components and usage patterns
- Fixing runtime errors and debugging issues
- Best practices for Forge architecture

**When to use MCP tools:**
- `mcp_forge-knowled_search-forge-docs` - Search for specific Forge documentation (component props, API methods, manifest syntax, code examples)
- `mcp_forge-knowled_list-forge-modules` - List all available Forge modules organized by product
- `mcp_forge-knowled_forge-app-manifest-guide` - Guide for configuring manifest.yaml file (MUST read before manifest changes)
- `mcp_forge-knowled_forge-development-guide` - Comprehensive guide for Forge app development (architecture, CLI, deployment)
- `mcp_forge-knowled_forge-ui-kit-developer-guide` - Guide for Forge UI Kit (React components, hooks, security, best practices)
- `mcp_forge-knowled_forge-backend-developer-guide` - Guide for backend development (resolvers, storage, API patterns)
- `mcp_forge-knowled_confluence-macro-developer-guide` - Guide for building Confluence macros with Forge UI Kit
- `mcp_forge-knowled_jira-service-management-assets-guide` - Guide for JSM Assets CMDB integration
- `mcp_forge-knowled_atlassian-design-tokens` - Design tokens for UI Kit Box components with XCSS

**Example Usage:**
```
When encountering a manifest.yml error:
1. Use mcp_forge-knowled_forge-app-manifest-guide to understand correct syntax
2. Use mcp_forge-knowled_search-forge-docs with query about the specific error
3. Apply fixes based on authoritative Forge documentation
```

**DO NOT** rely solely on general knowledge - Forge has specific constraints and patterns that require authoritative documentation.

## Architecture & Key Design Decisions

### Multi-Product Integration Pattern
LogiBrew chains actions across Atlassian products: Input (Jira issues/forms) → AI Analysis (Rovo agents) → Tasks (Jira) → Documentation (Confluence) → Notifications (JSM). Each component is connected through Forge modules and entity properties.

### Data Flow
1. **Input**: Shipment details via Jira custom fields (routes, cargo types, timelines, UN codes)
2. **Processing**: Rovo agents perform rule-based validations, compliance checks, scenario simulations
3. **Output**: Hash-verified logs, automated task creation, knowledge base updates
4. **Storage**: Entity Properties (Jira/Confluence), Forge Storage API with JSON metadata, sharded for scalability

### Verifiable Logging System
Uses JavaScript crypto libraries (SHA-256) to generate hash chains for tamper-evident decision records. Hash roots stored in Confluence docs or separate versioned logs for audit trails.

## Critical Forge Constraints

### UI Development - STRICT RULES
- **ONLY use @forge/react components** - importing React components from `react` or third-party packages WILL BREAK the app
- **NO standard HTML elements** (`<div>`, `<span>`, `<strong>`, etc.) - use UI Kit components only
- **See [UI-kit.md](../UI-kit.md)** for complete component list with LogiBrew-specific use cases
- **Prefer UI Kit over Custom UI** - only use Custom UI when absolutely necessary for specific features
- **Use forge-knowledge MCP server** for UI implementation questions:
  - `mcp_forge-knowled_forge-ui-kit-developer-guide` for component usage patterns
  - `mcp_forge-knowled_search-forge-docs` for specific component props and examples
- **Key components**: Badge, Box, Button, DynamicTable (NOT "Table"), Form, Heading, Text, Stack, Inline, Modal, SectionMessage, LineChart, BarChart
- **@forge/ui is deprecated** - never import from this package

### Data Storage Patterns
- **Entity Properties**: Use REST API (Issue Properties API, Content Properties API) - NO dedicated client-side API
- **Forge Storage/SQL**: Must call via `.asApp()` from backend resolvers, not from frontend
- **Client-side API requests**: Use `requestJira`, `requestConfluence` from `@forge/bridge` (often simpler than resolvers)

### Security & Authorization
- **Prefer `.asUser()`** when calling product REST APIs from resolvers (built-in auth checks)
- **If using `.asApp()`**: Manually check permissions via product permission REST APIs
- **Minimize scopes**: Only add scopes strictly required for needed APIs

## Developer Workflows

### Creating New Apps
```bash
# ALWAYS check if directory exists first
forge create -t <template-name> <app-name>
# Templates: rovo-agent-rovo, jira-issue-panel-ui-kit, confluence-macro-ui-kit, etc.
# Review directory contents before assuming files were created
```

### Build & Deploy Cycle
```bash
forge lint                    # Validate manifest.yml syntax (ALWAYS run after manifest changes)
forge deploy --non-interactive --e development
forge install --non-interactive --site <site-url> --product <product> --environment development
# Use --upgrade flag if changing scopes/permissions
```

**Available Atlassian Environments:**
- Production: `https://logibrew.atlassian.net/`
- Sandbox: `https://logibrew-sandbox.atlassian.net/`
- Testing: `https://axi-cms.atlassian.net/`

### Tunneling for Development
- **Redeploy + restart tunnel** if manifest.yml changes
- **NO redeploy needed** for code-only changes (hot reloaded)
- After closing tunnel with changes: ask user if they want to deploy

### Current Working Directory
**ALWAYS run `pwd`** before Forge commands (except `create`, `version`, `login`) - must be in app root.

**App Root**: `d:\LogiBrew\logibrew-x1\` - all Forge CLI commands MUST run from here.

## Resolver Pattern (CRITICAL for UI Kit Components)

**Frontend-Backend Communication**:
UI Kit components call backend functions via the Forge Resolver pattern using `invoke()` from `@forge/bridge`:

```javascript
// Frontend (src/macro/index.jsx, src/dashboard/index.jsx, etc.)
import { invoke } from '@forge/bridge';

const result = await invoke('getMacroLogs', { shipmentId: 'SHIP-001' });
// 'getMacroLogs' is the resolver function name defined in backend
```

```javascript
// Backend (src/index.js) - MUST use Resolver class
import Resolver from '@forge/resolver';

const macroResolver = new Resolver();

macroResolver.define('getMacroLogs', async (req) => {
  const { shipmentId } = req.payload || {};
  // Backend logic here
  return { data: 'result' };
});

export const logMacroResolver = macroResolver.getDefinitions();
```

**Key Rules**:
1. Resolver function names in `.define()` MUST match the names used in `invoke()` calls
2. Export resolver with `.getDefinitions()` - name MUST match manifest.yml function key
3. All data passed via `req.payload` object
4. Frontend receives resolved data directly (no need to unwrap)

**Example in manifest.yml**:
```yaml
function:
  - key: log-macro-resolver  # Matches export name
    handler: index.logMacroResolver
```

**Complete Resolver Examples from LogiBrew**:

1. **Macro Resolver** ([src/macro/index.jsx](../logibrew-x1/src/macro/index.jsx)):
```javascript
// Frontend
const result = await invoke('getMacroLogs', { shipmentId: 'default' });

// Backend (src/index.js)
const macroResolver = new Resolver();
macroResolver.define('getMacroLogs', async (req) => {
  const { shipmentId = 'default' } = req.payload || {};
  const chainKey = `shipment-${shipmentId}-chain`;
  const logChain = await storage.get(chainKey) || [];
  return { chain: logChain, chainLength: logChain.length };
});
export const logMacroResolver = macroResolver.getDefinitions();
```

2. **Dashboard Resolver** ([src/dashboard/index.jsx](../logibrew-x1/src/dashboard/index.jsx)):
```javascript
// Frontend
const result = await invoke('getDashboardMetrics', {});

// Backend (src/index.js)
const dashboardResolver = new Resolver();
dashboardResolver.define('getDashboardMetrics', async (req) => {
  // Aggregate metrics from storage
  const allKeys = await storage.query().where('key', 'startsWith', 'shipment-').getMany();
  return { summary: {...}, delayPatterns: [...], recentActivities: [...] };
});
export const dashboardResolver = dashboardResolver.getDefinitions();
```

3. **JSM Panel Resolver** ([src/jsm-panel/index.jsx](../logibrew-x1/src/jsm-panel/index.jsx)):
```javascript
// Frontend - note use of view.getContext() to get JSM request details
import { invoke, view } from '@forge/bridge';

const ctx = await view.getContext();
const result = await invoke('getJsmInsights', {
  requestKey: ctx.extension.request.key,
  portalId: ctx.extension.portal.id
});

// Backend (src/index.js)
const jsmPanelResolver = new Resolver();
jsmPanelResolver.define('getJsmInsights', async (req) => {
  const { requestKey, portalId } = req.payload || {};
  // Analyze request for logistics insights
  return { hasData: true, compliance: {...}, delays: {...}, actions: [...] };
});
export const jsmPanelResolver = jsmPanelResolver.getDefinitions();
```

## Project-Specific Conventions

### Code Style
- **Vanilla JavaScript** (idiomatic, no TypeScript)
- **Verbose comments** - explain for intermediate JS developers with limited Forge experience
- **Simple solutions preferred** - avoid over-engineering

### Naming & Structure
- Functions: Descriptive names like `messageLogger`, `validateShipmentCompliance`
- Modules: Follow pattern `<product>:<type>` (e.g., `rovo:agent`, `jira:issuePanel`)
- Files: Backend functions in `src/index.js` or separate modules as needed

### Custom UI to UI Kit Migration Strategy
- **Current State**: `static/shipment-panel/build/` contains Custom UI (React-based)
- **Goal**: Convert to UI Kit where features can be implemented with UI Kit components
- **Approach**: 
  1. Check if UI Kit components support required features (see [UI-kit.md](../UI-kit.md))
  2. If yes, create new UI Kit version in `src/shipment-panel/index.jsx`
  3. Update manifest.yml to use `resource` instead of Custom UI bundle
  4. Remove `static/` directory after successful migration
- **When to Keep Custom UI**: Only if advanced features require standard React (rare)

### Logistics Domain Specifics
- **UN codes validation**: For hazardous materials (IATA guidelines)
- **Multimodal shipments**: Sea-to-air transitions, reverse logistics
- **Compliance thresholds**: EU ETS emission limits, regulatory checks
- **Hash chains**: SHA-256 for verifiable proofs, stored with timestamps
- **Rules engine**: All validation rules in [src/rules.json](../logibrew-x1/src/rules.json) - versioned, updateable JSON

### Rules.json Structure (Do Not Modify Structure)
```json
{
  "complianceRules": {
    "unCodes": { "rules": [...] },           // UN hazmat codes with restrictions
    "emissionThresholds": { "rules": [...] }, // EU ETS, carbon offset limits
    "multimodalTransport": { "rules": [...] }, // Mode transition validations
    "perishableGoods": { "rules": [...] },    // Temperature/transit time limits
    "routeValidation": { "rules": [...] }     // Route/timeline checks
  },
  "metadata": { "version": "1.0.0", "sources": [...], "lastUpdated": "..." }
}
```
Import in backend: `import complianceRules from './rules.json';`

## Common Module Patterns

### UI Kit Component Usage
See [UI-kit.md](../UI-kit.md) for comprehensive component reference categorized by:
- **Layout & Structure**: Box, Inline, Stack, Frame
- **Form Elements**: Form, Textfield, Select, DatePicker, etc.
- **Charts & Visuals**: LineChart, BarChart, PieChart, DynamicTable
- **Feedback & Messages**: SectionMessage, ErrorMessage, Spinner, ProgressBar
- **Navigation & Modals**: Modal, Tabs, Popup

**UI Development Priority**:
1. Use UI Kit components from `@forge/react` (see [UI-kit.md](../UI-kit.md))
2. Consult `mcp_forge-knowled_forge-ui-kit-developer-guide` for implementation patterns
3. Only consider Custom UI if UI Kit components cannot achieve the requirement

**Standard UI Kit Component Import Pattern**:
```javascript
// CORRECT - Import from @forge/react
import ForgeReconciler, { 
  Stack, 
  Heading, 
  Text, 
  Spinner,
  DynamicTable,
  Form,
  Button
} from '@forge/react';
import { invoke } from '@forge/bridge';

// WRONG - DO NOT import from 'react' or other packages
// import React from 'react'; // ❌ BREAKS APP
// import { Table } from 'react-table'; // ❌ BREAKS APP
```

**Example Form Pattern**:
```javascript
import { Form, Textfield, Select, Button, Stack } from '@forge/react';

<Form onSubmit={handleSubmit}>
  <Stack space="space.200">
    <Textfield name="origin" label="Origin" isRequired />
    <Textfield name="destination" label="Destination" isRequired />
    <Select name="cargoType" label="Cargo Type" isRequired>
      <option value="hazmat">Hazmat</option>
      <option value="perishable">Perishable</option>
      <option value="general">General</option>
    </Select>
    <Button type="submit" appearance="primary">Validate Shipment</Button>
  </Stack>
</Form>
```

### Rovo Agent (Core)
```yaml
rovo:agent:
  - key: logistics-agent
    prompt: "Context-aware logistics expert..."
    actions: [validate-compliance, generate-log]
```
Invoke `action` modules for hash logging, API calls, workflow automation.

### Jira Extensions
- **issuePanel**: Forms for data entry (routes, cargo)
- **customField**: Specialized inputs (timelines, codes)
- **workflowValidator**: Compliance checks before transitions
- **workflowPostFunction**: Auto-generate logs, sync to Confluence

### Confluence Macros
- **macro**: Embed verifiable logs or AI insights in docs
- **contentProperty**: Indexed timestamped logs (CQL-searchable)

## Module Implementation Priority

### Phase 1: Core AI & Data Input (MVP)
1. **rovo:agent** - AI disruption analysis engine (already implemented)
2. **action** - Hash logging, compliance validation functions (already implemented)
3. **jira:issuePanel** - Shipment data entry forms (routes, cargo, timelines)
4. **jira:customField** - Specialized fields for UN codes, multimodal routes
5. **function** - Backend logic for hash chains, rule-based validations

### Phase 2: Workflow Automation
6. **jira:workflowValidator** - Compliance checks before issue transitions
7. **jira:workflowPostFunction** - Auto-generate logs, sync to Confluence
8. **trigger** - Real-time analysis on issue created/updated events
9. **confluence:macro** - Embed verifiable logs in documentation
10. **confluence:contentProperty** - Store indexed timestamped logs

### Phase 3: Team Collaboration
11. **jira:dashboardGadget** - Metrics dashboard (delay patterns, response times)
12. **confluence:globalPage** - Knowledge base for aggregated learnings
13. **jiraServiceManagement:portalRequestDetailPanel** - JSM insights/alerts
14. **scheduledTrigger** - Periodic trend forecasting, metric aggregation

### Phase 4: Advanced Features
15. **jira:issueContext** - Collapsible AI suggestion panels
16. **jiraServiceManagement:portalRequestViewAction** - Approval workflows
17. **jira:globalPage** - App-wide logistics trends dashboard
18. **webtrigger** - External webhook integrations (if needed)

**Implementation Strategy**: Build vertically (complete one user journey end-to-end) rather than horizontally. Example: Shipment input (Phase 1) → AI validation (Phase 1) → Compliance check (Phase 2) → Log documentation (Phase 2) forms one complete journey.

## External Integrations & Mock APIs

### Mock API Development Pattern
For demo deployments, use mock endpoints from [reference/mockApis.js](../reference/mockApis.js) instead of real external APIs.

**Available Mock APIs:**
- `getWeatherData(location)` - Weather conditions for route planning
- `getPortStatus(portCode)` - Port congestion and delays
- `validateUnCode(unCode, transportMode)` - UN hazmat validation
- `calculateEmissions(shipment)` - Carbon emission calculations

**Usage in Forge Actions:**
```javascript
import { getWeatherData, apiSwitch } from '../reference/mockApis.js';

export async function weatherAction(payload) {
  // Use mock API during development
  const weather = await getWeatherData(payload.location);
  return { weather, reliable: weather.reliable };
}
```

### Switching from Mock to Real APIs

**Step 1: Add Egress Permissions**
In [manifest.yml](../logibrew-x1/manifest.yml):
```yaml
permissions:
  external:
    fetch:
      backend:
        - 'api.openweathermap.org'  # Add real API domain
        - 'api.portauthority.com'
```

**Step 2: Set API Keys**
```bash
# Encrypt and store API keys
forge variables set --encrypt OPENWEATHER_API_KEY <your-key>
forge variables set --encrypt PORT_API_KEY <your-key>
```

**Step 3: Environment Variable Configuration**
In [manifest.yml](../logibrew-x1/manifest.yml):
```yaml
app:
  environment:
    USE_REAL_APIS: 'true'  # Switch to real APIs
```

**Step 4: Redeploy with Upgrade**
```bash
forge lint
forge deploy --non-interactive --e development
forge install --non-interactive --upgrade --site <site-url> --product <product> --environment development
```

**Step 5: Implement Real API Calls**
```javascript
import { apiSwitch, getWeatherData, realWeatherApiCall } from '../reference/mockApis.js';

export async function weatherAction(payload) {
  // Automatically switches based on USE_REAL_APIS env var
  const weather = await apiSwitch(
    'weather',
    getWeatherData,        // Mock function
    realWeatherApiCall,    // Real API function
    payload.location
  );
  return { weather };
}
```

**Fallback Strategy:**
Real API implementations in [mockApis.js](../reference/mockApis.js) include automatic fallback to mocks if real APIs fail (network errors, rate limits, etc.).

### Non-Real-Time Constraints
- All API calls must be server-side (backend functions/resolvers)
- Use exponential backoff for retries
- Cache frequent responses in Forge Storage
- Limit to non-blocking operations (async/await patterns)

## Hash Chain Implementation

Complete hash chain utilities are available in [reference/hashChain.js](../reference/hashChain.js).

**Key Functions:**
- `generateHash(record)` - SHA-256 hash generation with chain linking
- `verifyChain(logChain)` - Integrity verification for audit trails
- `storeHashRoot(pageId, hashRoot, metadata)` - Confluence persistence
- `logComplianceDecision(decision)` - Complete logging workflow
- `getVerifiedChain(shipmentId)` - Retrieve and verify shipment chains

**Import Pattern:**
```javascript
// In src/index.js or other backend functions
import { 
  generateHash, 
  verifyChain, 
  logComplianceDecision 
} from '../reference/hashChain.js';

// Use in Forge action or resolver
export async function complianceAction(payload) {
  const logEntry = await logComplianceDecision({
    action: payload.action,
    userId: payload.userId,
    shipmentId: payload.shipmentId,
    outcome: payload.outcome
  });
  return { success: true, hash: logEntry.hash };
}
```

See [reference/hashChain.js](../reference/hashChain.js) for full documentation and examples.

## Testing & Quality
- **Unit tests**: Mock inputs for agent logic validation
- **Load testing**: Target 500 concurrent users
- **Error handling**: Exponential backoff for API retries, structured JSON logging
- **Accessibility**: ARIA standards in UI components
- **Internationalization**: Atlassian locale support (20+ languages)

## Key Files & Directories
- [manifest.yml](../logibrew-x1/manifest.yml): App config, modules, scopes (lint after changes)
- [package.json](../logibrew-x1/package.json): Dependencies (install after adding packages)
- [src/index.js](../logibrew-x1/src/index.js): Backend function handlers
- [UI-kit.md](../UI-kit.md): Complete UI Kit component reference for LogiBrew
- [reference/hashChain.js](../reference/hashChain.js): Complete hash chain implementation
- [reference/mockApis.js](../reference/mockApis.js): Mock external API utilities
- [agent-docs/changelog.md](../agent-docs/changelog.md): Development log and feature tracking
- [AGENTS.md](../logibrew-x1/AGENTS.md): Original agent development guidelines
- [README.md](../README.md): Product vision, features, technical architecture
- [Modules.md](../Modules.md): Comprehensive Forge module reference with priorities

## Anti-Patterns to Avoid
- Using empty templates or `-t custom-ui` (only ui-kit authorized)
- Deploying with `--no-verify` unless explicitly requested
- Assuming file creation without reviewing directory
- Using `<Table>` component (use `DynamicTable` instead)
- Running Forge commands outside app root directory
- Importing React components from non-@forge packages

## When Stuck

### Forge-Specific Issues (PRIORITY)
1. **Manifest errors**: Use `mcp_forge-knowled_forge-app-manifest-guide` BEFORE making changes
2. **Module questions**: Use `mcp_forge-knowled_list-forge-modules` to discover available modules, then check [Modules.md](../Modules.md) for LogiBrew priorities
3. **UI Kit errors**: Use `mcp_forge-knowled_forge-ui-kit-developer-guide` for component usage
4. **CLI errors**: Use `mcp_forge-knowled_search-forge-docs` with error message, then try `--verbose` flag
5. **Backend issues**: Use `mcp_forge-knowled_forge-backend-developer-guide` for resolver patterns
6. **Syntax issues**: Run `forge lint --verbose`, then use `mcp_forge-knowled_search-forge-docs` to understand error

### LogiBrew-Specific Resources
7. **Unclear requirements**: Ask user for clarification
8. **Hash chain logic**: See [reference/hashChain.js](../reference/hashChain.js) for complete implementation
9. **API integration**: Use mocks from [reference/mockApis.js](../reference/mockApis.js) for development
10. **Development history**: Check [agent-docs/changelog.md](../agent-docs/changelog.md) for context

**REMEMBER**: Always consult forge-knowledge MCP server for authoritative Forge documentation before attempting fixes or implementations.

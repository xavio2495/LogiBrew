# LogiBrew Next Development Steps

**Date**: December 21, 2025  
**Status**: Post-Phase 2 Completion, Phase 3 In Progress  
**Purpose**: Comprehensive roadmap for remaining features and enhancements

---

## Executive Summary

Following the comprehensive audit in `second-dev-phases.md`, critical bugs have been resolved and LogiBrew is now at **Phase 2 completion (100%)** with **Phase 3 at 75%**. This document outlines the remaining development work organized by:

1. **Immediate Priorities** (Complete Phase 3)
2. **Phase 4 Advanced Features** (New capabilities)
3. **Quality & Performance Enhancements**
4. **External Integration & Production Readiness**

**Overall Progress**: 7 of 11 core README.md features fully implemented, 4 features partially complete.

---

## Part 1: Status Review - What's Been Fixed

### ✅ **Critical Issues Resolved** (from second-dev-phases.md)

1. **Custom UI `<Em>` Component Bug** - FIXED
   - Issue: Forbidden HTML-style component usage
   - Resolution: Migrated to UI Kit or removed emphasis
   
2. **Resolver Function Mismatch** - FIXED
   - Issue: Missing `validateShipmentData` resolver definition
   - Resolution: Added resolver with correct naming pattern
   
3. **Manifest Configuration Error** - FIXED
   - Issue: Issue panel using wrong module pattern
   - Resolution: Updated to `resource` + `resolver` pattern
   
4. **Package.json Metadata** - FIXED
   - Issue: Template name instead of project name
   - Resolution: Updated to "logibrew-x1" with proper description

### ✅ **Phase 1-2 Completion Verified**

**Phase 1 (MVP)** - 100% Complete:
- ✅ Rovo agent with logistics expertise
- ✅ 3 Rovo actions (compliance, logging, emissions)
- ✅ Jira custom fields (UN code, transport modes, timeline)
- ✅ Jira issue panel (now UI Kit compliant)
- ✅ Backend functions with rules.json integration

**Phase 2 (Workflow Automation)** - 100% Complete:
- ✅ Workflow validator (compliance checks)
- ✅ Workflow post-function (decision logging)
- ✅ Event triggers (issue created/updated)
- ✅ Confluence macro (verifiable logs)
- ✅ Confluence content properties (CQL-searchable)

---

## Part 2: Phase 3 Completion - Team Collaboration (25% Remaining)

### 2.1 Scheduled Triggers for Trend Forecasting

**Status**: ❌ Not Started  
**Priority**: HIGH  
**Module**: `scheduledTrigger`  
**Estimated Time**: 4-6 hours

#### Requirements from README.md
- **Feature**: "Trend Forecasting - identifies patterns from aggregated inputs"
- **Use Case**: Periodic analysis of delay patterns, compliance trends, resource utilization

#### Implementation Plan

**A. Create Scheduled Function for Metrics Aggregation**

Location: `src/index.js`

```javascript
/**
 * Scheduled Trend Forecasting Function
 * 
 * Runs daily to aggregate shipment data and identify patterns.
 * Calculates rolling averages, identifies anomalies, predicts delays.
 */
export async function scheduledTrendForecasting() {
  console.log('Starting scheduled trend forecasting...');
  
  try {
    // 1. Retrieve all shipment chains from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const allKeys = await storage.query()
      .where('key', 'startsWith', 'shipment-')
      .getMany();
    
    // 2. Aggregate metrics
    const metrics = {
      totalShipments: 0,
      delayedShipments: 0,
      avgDelayHours: 0,
      topDelayCauses: {},
      complianceIssues: 0,
      emissionTrends: []
    };
    
    for (const { key, value } of allKeys.results) {
      if (Array.isArray(value)) {
        // Analyze log chain for patterns
        const recentEntries = value.filter(entry => entry.timestamp > thirtyDaysAgo);
        
        metrics.totalShipments++;
        
        // Detect delays
        const hasDelay = recentEntries.some(e => 
          e.action.includes('delay') || e.decision?.status === 'delayed'
        );
        if (hasDelay) metrics.delayedShipments++;
        
        // Count delay causes
        recentEntries.forEach(entry => {
          if (entry.decision?.cause) {
            metrics.topDelayCauses[entry.decision.cause] = 
              (metrics.topDelayCauses[entry.decision.cause] || 0) + 1;
          }
        });
      }
    }
    
    // 3. Calculate forecasts
    const delayRate = (metrics.delayedShipments / metrics.totalShipments) * 100;
    const forecast = {
      timestamp: Date.now(),
      period: '30-day',
      delayRate: Math.round(delayRate * 100) / 100,
      topDelayCauses: Object.entries(metrics.topDelayCauses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cause, count]) => ({ cause, count })),
      recommendation: delayRate > 20 
        ? 'High delay rate detected - review route planning procedures'
        : 'Delay rate within acceptable range'
    };
    
    // 4. Store forecast
    await storage.set('latest-trend-forecast', forecast);
    
    console.log(`Trend forecast completed: ${forecast.delayRate}% delay rate`);
    return { success: true, forecast };
    
  } catch (error) {
    console.error('Trend forecasting error:', error);
    return { success: false, error: error.message };
  }
}
```

**B. Add Scheduled Trigger to Manifest**

Location: `manifest.yml`

```yaml
scheduledTrigger:
  - key: daily-trend-forecast
    function: scheduled-trend-forecast
    interval: daily  # Run at midnight UTC
```

**C. Add Function Handler**

```yaml
function:
  - key: scheduled-trend-forecast
    handler: index.scheduledTrendForecasting
```

**D. Expose Forecast Data in Dashboard Resolver**

Update `getDashboardMetrics` resolver to include forecast:

```javascript
dashboardResolver.define('getDashboardMetrics', async (req) => {
  // ... existing code ...
  
  // Get latest forecast
  const forecast = await storage.get('latest-trend-forecast') || null;
  
  return {
    data: true,
    summary: { /* ... */ },
    delayPatterns: [ /* ... */ ],
    recentActivities: [ /* ... */ ],
    forecast: forecast,  // NEW: Add forecast data
    lastUpdated: Date.now()
  };
});
```

**E. Update Dashboard UI to Display Forecast**

Location: `src/dashboard/index.jsx`

```javascript
// Add after recentActivities table
{metrics.forecast && (
  <Stack space="space.100">
    <Heading size="small">30-Day Trend Forecast</Heading>
    <SectionMessage 
      title="Delay Rate Projection" 
      appearance={metrics.forecast.delayRate > 20 ? 'warning' : 'info'}
    >
      <Stack space="space.100">
        <Text>
          Projected delay rate: <Strong>{metrics.forecast.delayRate}%</Strong>
        </Text>
        <Text>{metrics.forecast.recommendation}</Text>
      </Stack>
    </SectionMessage>
    
    <Text appearance="subtle">Top delay causes:</Text>
    {metrics.forecast.topDelayCauses.map((item, idx) => (
      <Inline key={idx} space="space.100" alignBlock="center">
        <Text>{item.cause}</Text>
        <Badge>{item.count} occurrences</Badge>
      </Inline>
    ))}
  </Stack>
)}
```

#### UI Kit Components Required
- `Strong` (from @forge/react) - For emphasis
- `Badge` (already in use) - For counts
- `SectionMessage` (already in use) - For forecast display

#### Success Criteria
- [ ] Scheduled trigger runs daily without errors
- [ ] Forecast data stored in Forge Storage
- [ ] Dashboard displays 30-day trends with top 5 delay causes
- [ ] Recommendations adjust based on delay rate threshold (>20%)

---

### 2.2 Additional Phase 3 Items (Optional)

**A. Jira Issue Action - Quick AI Analysis**

**Status**: Suggested enhancement  
**Module**: `jira:issueAction`  
**Time**: 2 hours

Add quick action button "Run AI Disruption Analysis" to issue view:

```yaml
jira:issueAction:
  - key: quick-analysis-action
    name: Run LogiBrew Analysis
    function: quick-analysis-handler
```

**B. Project Settings Page - Configure Retention**

**Status**: Suggested enhancement  
**Module**: `jira:projectSettingsPage`  
**Time**: 3 hours

Allow project admins to configure log retention periods (30/60/90 days).

---

## Part 3: Phase 4 Advanced Features (Not Started - 0%)

### 3.1 Scenario Simulation Modals

**Status**: ❌ Not Started  
**Priority**: HIGH (README.md core feature)  
**Estimated Time**: 8-12 hours

#### Requirements from README.md
- **Feature**: "Scenario Simulations - model basic outcomes like cost impacts from delays"
- **Use Case**: Users test "what-if" scenarios (e.g., "What if we switch from air to sea?")

#### Implementation Plan

**A. Create Simulation Resolver**

Location: `src/index.js`

```javascript
const simulationResolver = new Resolver();

simulationResolver.define('runScenarioSimulation', async (req) => {
  const { 
    baseScenario,  // Current shipment details
    changes        // Proposed changes (route, mode, timeline)
  } = req.payload || {};
  
  try {
    // 1. Baseline calculations
    const baselineCompliance = await validateCompliance({
      unCode: baseScenario.unCode,
      transportMode: baseScenario.transportMode,
      cargoType: baseScenario.cargoType,
      weight: baseScenario.weight
    });
    
    const baselineEmissions = await calculateEmissions({
      origin: baseScenario.origin,
      destination: baseScenario.destination,
      transportMode: baseScenario.transportMode,
      weight: baseScenario.weight,
      distance: baseScenario.distance
    });
    
    // 2. Scenario calculations with proposed changes
    const scenarioCompliance = await validateCompliance({
      unCode: changes.unCode || baseScenario.unCode,
      transportMode: changes.transportMode || baseScenario.transportMode,
      cargoType: changes.cargoType || baseScenario.cargoType,
      weight: changes.weight || baseScenario.weight
    });
    
    const scenarioEmissions = await calculateEmissions({
      origin: changes.origin || baseScenario.origin,
      destination: changes.destination || baseScenario.destination,
      transportMode: changes.transportMode || baseScenario.transportMode,
      weight: changes.weight || baseScenario.weight,
      distance: changes.distance || baseScenario.distance
    });
    
    // 3. Calculate deltas
    const emissionDelta = scenarioEmissions.emissions.total - 
                          baselineEmissions.emissions.total;
    const emissionChange = Math.round((emissionDelta / baselineEmissions.emissions.total) * 100);
    
    // 4. Estimate cost/time impacts (simplified)
    const costFactors = { air: 5, sea: 1, road: 2, rail: 1.5 };
    const timeFactors = { air: 1, sea: 20, road: 10, rail: 15 };
    
    const baseCost = baseScenario.weight * costFactors[baseScenario.transportMode];
    const scenarioCost = (changes.weight || baseScenario.weight) * 
                         costFactors[changes.transportMode || baseScenario.transportMode];
    const costDelta = scenarioCost - baseCost;
    
    const baseTime = (baseScenario.distance || 1000) / 100 * 
                     timeFactors[baseScenario.transportMode];
    const scenarioTime = (changes.distance || baseScenario.distance || 1000) / 100 * 
                         timeFactors[changes.transportMode || baseScenario.transportMode];
    const timeDelta = scenarioTime - baseTime;
    
    // 5. Return comparison
    return {
      success: true,
      baseline: {
        compliance: baselineCompliance,
        emissions: baselineEmissions.emissions.total,
        estimatedCost: Math.round(baseCost),
        estimatedTimeHours: Math.round(baseTime)
      },
      scenario: {
        compliance: scenarioCompliance,
        emissions: scenarioEmissions.emissions.total,
        estimatedCost: Math.round(scenarioCost),
        estimatedTimeHours: Math.round(scenarioTime)
      },
      deltas: {
        emissions: {
          absolute: Math.round(emissionDelta * 100) / 100,
          percentage: emissionChange
        },
        cost: {
          absolute: Math.round(costDelta),
          percentage: Math.round((costDelta / baseCost) * 100)
        },
        time: {
          absolute: Math.round(timeDelta),
          percentage: Math.round((timeDelta / baseTime) * 100)
        }
      },
      recommendation: emissionChange < -30 && costDelta < 0 
        ? 'Scenario improves both emissions and cost - recommended'
        : emissionChange < -30 
          ? 'Scenario significantly reduces emissions but may increase cost'
          : 'Scenario trade-offs require stakeholder review'
    };
    
  } catch (error) {
    console.error('Simulation error:', error);
    throw new Error(`Failed to run simulation: ${error.message}`);
  }
});

export const simulationResolver = simulationResolver.getDefinitions();
```

**B. Create Simulation UI Component**

Location: `src/shipment-panel/index.jsx` (add simulation modal)

```javascript
import React, { useState } from 'react';
import ForgeReconciler, {
  Stack,
  Button,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalTransition,
  Form,
  Select,
  Textfield,
  SectionMessage,
  Text,
  Inline,
  Badge,
  Spinner
} from '@forge/react';
import { invoke } from '@forge/bridge';

const SimulationModal = ({ isOpen, onClose, currentShipment }) => {
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState(null);
  const [scenarioChanges, setScenarioChanges] = useState({});

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const result = await invoke('runScenarioSimulation', {
        baseScenario: currentShipment,
        changes: scenarioChanges
      });
      setResults(result);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={onClose}>
          <ModalHeader>
            <ModalTitle>Scenario Simulation</ModalTitle>
          </ModalHeader>
          
          <ModalBody>
            <Stack space="space.200">
              <Text>
                Test "what-if" scenarios by changing shipment parameters below.
              </Text>
              
              <Form onSubmit={runSimulation}>
                <Stack space="space.150">
                  <Select
                    name="transportMode"
                    label="Change Transport Mode"
                    onChange={(value) => setScenarioChanges({
                      ...scenarioChanges,
                      transportMode: value
                    })}
                  >
                    <option value="">Keep current ({currentShipment.transportMode})</option>
                    <option value="air">Switch to Air</option>
                    <option value="sea">Switch to Sea</option>
                    <option value="road">Switch to Road</option>
                    <option value="rail">Switch to Rail</option>
                  </Select>
                  
                  <Textfield
                    name="weight"
                    label="Change Weight (kg)"
                    type="number"
                    placeholder={`Current: ${currentShipment.weight}kg`}
                    onChange={(value) => setScenarioChanges({
                      ...scenarioChanges,
                      weight: parseFloat(value)
                    })}
                  />
                </Stack>
              </Form>
              
              {simulating && (
                <Inline space="space.100" alignBlock="center">
                  <Spinner size="small" />
                  <Text>Running simulation...</Text>
                </Inline>
              )}
              
              {results && !simulating && (
                <Stack space="space.150">
                  <SectionMessage 
                    title="Simulation Results" 
                    appearance="information"
                  >
                    <Text>{results.recommendation}</Text>
                  </SectionMessage>
                  
                  <Stack space="space.100">
                    <Text><Strong>Emissions Impact:</Strong></Text>
                    <Inline space="space.100">
                      <Badge appearance={results.deltas.emissions.percentage < 0 ? 'success' : 'removed'}>
                        {results.deltas.emissions.percentage > 0 ? '+' : ''}
                        {results.deltas.emissions.percentage}%
                      </Badge>
                      <Text>
                        ({results.deltas.emissions.absolute > 0 ? '+' : ''}
                        {results.deltas.emissions.absolute}kg CO2)
                      </Text>
                    </Inline>
                  </Stack>
                  
                  <Stack space="space.100">
                    <Text><Strong>Cost Impact:</Strong></Text>
                    <Inline space="space.100">
                      <Badge appearance={results.deltas.cost.percentage < 0 ? 'success' : 'primary'}>
                        {results.deltas.cost.percentage > 0 ? '+' : ''}
                        {results.deltas.cost.percentage}%
                      </Badge>
                      <Text>
                        ({results.deltas.cost.absolute > 0 ? '+$' : '-$'}
                        {Math.abs(results.deltas.cost.absolute)})
                      </Text>
                    </Inline>
                  </Stack>
                  
                  <Stack space="space.100">
                    <Text><Strong>Time Impact:</Strong></Text>
                    <Inline space="space.100">
                      <Badge appearance={results.deltas.time.percentage < 0 ? 'success' : 'primary'}>
                        {results.deltas.time.percentage > 0 ? '+' : ''}
                        {results.deltas.time.percentage}%
                      </Badge>
                      <Text>
                        ({results.deltas.time.absolute > 0 ? '+' : ''}
                        {results.deltas.time.absolute} hours)
                      </Text>
                    </Inline>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
            <Button 
              appearance="primary" 
              onClick={runSimulation}
              isDisabled={simulating || Object.keys(scenarioChanges).length === 0}
            >
              Run Simulation
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
```

**C. Add to Manifest**

```yaml
function:
  - key: simulation-resolver
    handler: index.simulationResolver
```

#### UI Kit Components Required (NEW)
- ✅ Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter (navigation)
- ✅ ModalTransition (animation)
- ✅ Strong (text formatting)
- All other components already in use

#### Success Criteria
- [ ] Modal opens from shipment panel "Simulate Scenario" button
- [ ] Users can change transport mode and weight
- [ ] Simulation calculates emission/cost/time deltas
- [ ] Results display with color-coded badges (green = improvement)
- [ ] Recommendation text adapts based on trade-offs

---

### 3.2 Automatic Task Creation (README.md Feature Gap)

**Status**: ❌ Not Started  
**Priority**: MEDIUM  
**Estimated Time**: 6-8 hours

#### Requirements from README.md
- **Feature**: "Task Automation - creates linked tasks in Atlassian tools based on insights"
- **Use Case**: "Auto-generating a JSM ticket for stakeholder approval"

#### Implementation Plan

**A. Enhance Workflow Post-Function for Task Creation**

Location: `src/index.js` - Update `workflowPostFunction`

```javascript
export async function workflowPostFunction(event) {
  console.log('Workflow post function invoked:', event);

  try {
    const { issue, transition, changelog } = event;
    
    // ... existing logging code ...
    
    // NEW: Check if transition requires stakeholder approval
    if (transition.to_status === 'Pending Approval' || 
        issue.fields.labels?.includes('high-risk')) {
      
      // Create JSM request for approval
      const jsmRequest = await createApprovalRequest({
        shipmentKey: issue.key,
        summary: `Approve shipment: ${issue.fields.summary}`,
        description: `Shipment ${issue.key} requires stakeholder approval.\n\n` +
                    `Route: ${issue.fields.customfield_origin || 'N/A'} → ` +
                    `${issue.fields.customfield_destination || 'N/A'}\n` +
                    `Compliance Status: ${logEntry.decision?.status || 'Unknown'}\n\n` +
                    `Please review and approve.`,
        requestType: 'shipment-approval',
        linkedIssue: issue.key
      });
      
      console.log(`Created JSM approval request: ${jsmRequest.key}`);
      
      // Add comment to original issue
      await api.asUser().requestJira(`/rest/api/3/issue/${issue.key}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: `Approval request created: ${jsmRequest.key}`
              }]
            }]
          }
        })
      });
    }
    
  } catch (error) {
    console.error('Workflow post function error:', error);
  }
}

async function createApprovalRequest({ shipmentKey, summary, description, requestType, linkedIssue }) {
  // Use Jira REST API to create service request
  const response = await api.asUser().requestJira('/rest/servicedeskapi/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceDeskId: '1',  // TODO: Make configurable
      requestTypeId: '10',  // TODO: Make configurable
      requestFieldValues: {
        summary: summary,
        description: description
      }
    })
  });
  
  const request = await response.json();
  
  // Link to original issue
  await api.asUser().requestJira(`/rest/api/3/issue/${linkedIssue}/remotelink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      object: {
        url: `https://your-site.atlassian.net/servicedesk/${request.issueKey}`,
        title: `Approval Request: ${request.issueKey}`,
        icon: { url16x16: 'https://your-site.atlassian.net/favicon.ico' }
      }
    })
  });
  
  return request;
}
```

**B. Add Required Scopes to Manifest**

```yaml
permissions:
  scopes:
    - storage:app
    - read:jira-work
    - write:jira-work  # NEW: For creating issues/comments
    - manage:jira-configuration
    - write:confluence-content
    - read:confluence-content.all
    - read:servicedesk-request  # NEW: For JSM requests
    - write:servicedesk-request  # NEW: For creating requests
```

#### Success Criteria
- [ ] Workflow transitions to "Pending Approval" auto-create JSM request
- [ ] JSM request contains shipment details and compliance status
- [ ] Original Jira issue gets comment with JSM request link
- [ ] Remote link created between Jira issue and JSM request

---

### 3.3 Real-Time Sync Mechanism (README.md Feature Gap)

**Status**: ❌ Not Started  
**Priority**: LOW (Nice-to-have)  
**Estimated Time**: 12-16 hours

#### Requirements from README.md
- **Feature**: "Real-time shared insights across teams"
- **Challenge**: Forge doesn't support WebSockets/real-time push

#### Implementation Options

**Option A: Polling with Short Intervals** (Simpler)

Update UI Kit components to poll every 30 seconds:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const freshData = await invoke('getDashboardMetrics', {});
    setMetrics(freshData);
  }, 30000); // Poll every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**Option B: Consumer Module with Event Queue** (More Complex)

Use Forge `consumer` module to handle async events:

```yaml
consumer:
  - key: shipment-update-consumer
    queue: shipment-updates
    function: shipment-update-handler
    resolver:
      function: handle-consumer-event
```

**Recommendation**: Start with Option A (polling) as it's simpler and Forge limitations make true real-time difficult.

---

### 3.4 Command Palette Integration

**Status**: ❌ Not Started  
**Priority**: LOW (Enhancement)  
**Module**: `jira:commandPalette`  
**Estimated Time**: 2 hours

Add quick commands like "Flag Shipment Disruption" to Jira command palette:

```yaml
jira:commandPalette:
  - key: flag-disruption-command
    name: Flag Disruption
    description: Mark issue as disrupted and run AI analysis
    function: flag-disruption-handler
```

---

## Part 4: Quality & Performance Enhancements

### 4.1 Unit Testing Suite

**Status**: ❌ 0% Coverage (HIGH RISK)  
**Priority**: HIGH  
**Estimated Time**: 2-3 days

#### Create Test Infrastructure

**A. Install Testing Dependencies**

```bash
cd d:\LogiBrew\logibrew-x1
npm install --save-dev jest @types/jest
```

**B. Create Test Files**

Location: `tests/validateCompliance.test.js`

```javascript
import { validateCompliance } from '../src/index.js';
import complianceRules from '../src/rules.json';

describe('validateCompliance', () => {
  test('should validate valid UN code for air transport', async () => {
    const result = await validateCompliance({
      unCode: 'UN1950',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 50
    });
    
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.details.unCode.code).toBe('UN1950');
  });
  
  test('should flag forbidden UN code on passenger aircraft', async () => {
    const result = await validateCompliance({
      unCode: 'UN2814',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 20
    });
    
    expect(result.isValid).toBe(true); // Allowed on cargo aircraft
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].type).toBe('PASSENGER_AIRCRAFT_RESTRICTION');
  });
  
  test('should reject invalid UN code format', async () => {
    const result = await validateCompliance({
      unCode: 'INVALID',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 50
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_UN_CODE_FORMAT');
  });
  
  test('should validate perishable cargo temperature requirements', async () => {
    const result = await validateCompliance({
      transportMode: 'sea',
      cargoType: 'perishable',
      weight: 1000
    });
    
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].type).toBe('PERISHABLE_REQUIREMENTS');
    expect(result.details.perishable).toBeDefined();
  });
});
```

Location: `tests/calculateEmissions.test.js`

```javascript
import { calculateEmissions } from '../src/index.js';

describe('calculateEmissions', () => {
  test('should calculate emissions for sea transport', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.total).toBeGreaterThan(0);
    expect(result.emissions.breakdown.emissionFactor).toBe(0.01);
  });
  
  test('should flag EU ETS threshold breach', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'air',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.compliance.euEts.exceeded).toBe(true);
    expect(result.compliance.euEts.status).toBe('reporting_required');
  });
});
```

Location: `tests/hashChain.test.js`

```javascript
import { generateHash, verifyChain } from '../reference/hashChain.js';

describe('Hash Chain Utilities', () => {
  test('should generate deterministic hash', () => {
    const record = {
      timestamp: 1234567890,
      action: 'test_action',
      userId: 'test_user',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };
    
    const hash1 = generateHash(record);
    const hash2 = generateHash(record);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64-char hex
  });
  
  test('should verify valid chain', () => {
    const chain = [
      {
        timestamp: 1000,
        action: 'create',
        hash: generateHash({ timestamp: 1000, action: 'create', previousHash: '0' }),
        previousHash: '0'
      }
    ];
    
    expect(verifyChain(chain)).toBe(true);
  });
  
  test('should detect tampered chain', () => {
    const chain = [
      { hash: 'abc123', previousHash: '0' },
      { hash: 'def456', previousHash: 'WRONG' } // Should be 'abc123'
    ];
    
    expect(verifyChain(chain)).toBe(false);
  });
});
```

**C. Add Test Script to package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### Target Coverage Goals
- **validateCompliance**: 90% coverage (high complexity)
- **calculateEmissions**: 85% coverage
- **Hash chain utilities**: 95% coverage (security-critical)
- **Resolvers**: 70% coverage (integration tests)

---

### 4.2 Input Validation Enhancements

**Status**: Partial implementation  
**Priority**: HIGH (Security)  
**Estimated Time**: 4-6 hours

#### Add Input Sanitization Library

```bash
npm install validator
```

#### Enhance Validation Functions

Location: `src/index.js`

```javascript
import validator from 'validator';

export async function validateCompliance(payload) {
  // NEW: Strict input sanitization
  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_PAYLOAD',
        severity: 'error',
        message: 'Invalid payload structure',
        recommendation: 'Ensure payload is a valid object with required fields'
      }]
    };
  }

  // Sanitize string inputs
  const unCode = payload.unCode 
    ? validator.escape(String(payload.unCode).trim().toUpperCase()) 
    : '';
  
  const transportMode = payload.transportMode 
    ? validator.escape(String(payload.transportMode).trim().toLowerCase())
    : '';
  
  const cargoType = payload.cargoType
    ? validator.escape(String(payload.cargoType).trim().toLowerCase())
    : '';
  
  // Validate numeric inputs
  const weight = parseFloat(payload.weight);
  if (isNaN(weight) || weight <= 0 || weight > 1000000) {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_WEIGHT',
        severity: 'error',
        message: `Invalid weight: ${payload.weight}. Must be between 0 and 1,000,000 kg`,
        recommendation: 'Enter a valid cargo weight in kilograms'
      }]
    };
  }
  
  // Continue with existing validation logic...
}
```

#### Add Rate Limiting (DOS Protection)

```javascript
// Simple in-memory rate limiter
const rateLimitMap = new Map();

function checkRateLimit(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove old requests outside window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded - too many requests');
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
}

// Use in resolvers
macroResolver.define('getMacroLogs', async (req) => {
  const userId = req.context?.accountId || 'anonymous';
  checkRateLimit(userId, 100, 60000); // 100 requests per minute
  
  // ... existing logic
});
```

---

### 4.3 Error Handling & Logging Improvements

**Status**: Basic error handling exists  
**Priority**: MEDIUM  
**Estimated Time**: 3-4 hours

#### Structured Logging Utility

Location: `src/utils/logger.js` (NEW FILE)

```javascript
/**
 * Structured logging utility for LogiBrew
 * 
 * Provides consistent log format with severity levels and context.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

export function log(level, message, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    context,
    app: 'logibrew'
  };
  
  const logString = JSON.stringify(logEntry);
  
  switch (level) {
    case 'error':
    case 'critical':
      console.error(logString);
      break;
    case 'warn':
      console.warn(logString);
      break;
    default:
      console.log(logString);
  }
}

export const logger = {
  debug: (msg, ctx) => log('debug', msg, ctx),
  info: (msg, ctx) => log('info', msg, ctx),
  warn: (msg, ctx) => log('warn', msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
  critical: (msg, ctx) => log('critical', msg, ctx)
};
```

#### Use in Functions

```javascript
import { logger } from './utils/logger.js';

export async function validateCompliance(payload) {
  logger.info('Starting compliance validation', { 
    unCode: payload.unCode,
    transportMode: payload.transportMode 
  });
  
  try {
    // ... validation logic
    
    logger.info('Compliance validation completed', { 
      isValid: validationResult.isValid,
      issuesCount: validationResult.issues.length 
    });
    return validationResult;
    
  } catch (error) {
    logger.error('Compliance validation failed', { 
      error: error.message,
      stack: error.stack,
      payload 
    });
    throw error;
  }
}
```

---

## Part 5: External Integration & Production Readiness

### 5.1 Real Weather API Integration

**Status**: Mock APIs only  
**Priority**: MEDIUM  
**Estimated Time**: 1 day

#### Switch from Mock to Real APIs

**A. Add Egress Permissions**

Location: `manifest.yml`

```yaml
permissions:
  scopes:
    - storage:app
    - read:jira-work
    - write:jira-work
    - manage:jira-configuration
    - write:confluence-content
    - read:confluence-content.all
  external:
    fetch:
      backend:
        - 'api.openweathermap.org'
        - 'api.portauthority.com'  # Replace with actual port API
```

**B. Set API Keys**

```bash
cd d:\LogiBrew\logibrew-x1
forge variables set --encrypt OPENWEATHER_API_KEY <your-key>
forge variables set --encrypt PORT_API_KEY <your-key>
```

**C. Update Environment Variable**

```yaml
app:
  environment:
    USE_REAL_APIS: 'true'  # Switch to real APIs
```

**D. Implement Real API Calls**

Location: `reference/mockApis.js` (update `realWeatherApiCall`)

Already implemented - just needs API keys and deployment.

**E. Redeploy with Upgrade**

```bash
forge lint
forge deploy --non-interactive --e development
forge install --non-interactive --upgrade --site https://axi-cms.atlassian.net/ --product jira --environment development
```

---

### 5.2 Performance Optimization

**Status**: Basic performance acceptable  
**Priority**: LOW (unless scaling issues)  
**Estimated Time**: 2-3 days

#### Optimization Opportunities

**A. Query Optimization**

Current `storage.query()` loads all shipment chains - can be slow at scale.

```javascript
// BEFORE: Load all chains
const allKeys = await storage.query()
  .where('key', 'startsWith', 'shipment-')
  .getMany();

// AFTER: Add pagination
const allKeys = await storage.query()
  .where('key', 'startsWith', 'shipment-')
  .limit(100)  // Process in batches
  .getMany();
```

**B. Caching Frequent Queries**

Cache rules.json in memory instead of importing repeatedly:

```javascript
let cachedRules = null;
let cacheTimestamp = 0;

function getRules() {
  const now = Date.now();
  if (!cachedRules || now - cacheTimestamp > 3600000) { // Cache for 1 hour
    cachedRules = complianceRules;
    cacheTimestamp = now;
  }
  return cachedRules;
}
```

**C. Async Parallel Processing**

Process multiple validations in parallel:

```javascript
const [complianceResult, emissionsResult] = await Promise.all([
  validateCompliance(payload),
  calculateEmissions(payload)
]);
```

---

## Part 6: Documentation & Knowledge Sharing

### 6.1 User Documentation

**Status**: ❌ Not Started  
**Priority**: MEDIUM  
**Estimated Time**: 1-2 days

#### Create User Guides

**A. Confluence Space for Documentation**

1. Create "LogiBrew Documentation" space
2. Add pages:
   - Getting Started Guide
   - How to Enter Shipment Data
   - Understanding Compliance Validation
   - Reading Verifiable Logs
   - Using Scenario Simulations
   - FAQ & Troubleshooting

**B. Inline Help Text**

Add helper messages to forms:

```javascript
<Form onSubmit={handleSubmit}>
  <Textfield name="unCode" label="UN Code">
    <HelperMessage>
      Enter the UN hazardous material code (e.g., UN1203 for gasoline). 
      Leave empty for non-hazmat cargo.
    </HelperMessage>
  </Textfield>
</Form>
```

---

### 6.2 Developer Documentation

**Status**: Partial (AGENTS.md, copilot-instructions.md exist)  
**Priority**: MEDIUM  
**Estimated Time**: 1 day

#### Enhancements Needed

**A. API Reference Documentation**

Create `docs/API.md`:

```markdown
# LogiBrew API Reference

## Backend Functions

### validateCompliance(payload)

Validates shipment against regulatory standards.

**Parameters:**
- `unCode` (string, optional): UN hazmat code
- `transportMode` (string, required): air|sea|road|rail
- `cargoType` (string, required): hazmat|perishable|general
- `weight` (number, required): Weight in kg

**Returns:**
```json
{
  "isValid": boolean,
  "issues": Array<Issue>,
  "warnings": Array<Warning>,
  "recommendations": Array<string>
}
```

**B. Architecture Diagram**

Create visual diagram showing:
- Rovo agent flow
- Data storage patterns
- Multi-product integration
- Hash chain verification

---

## Part 7: Summary & Priority Roadmap

### Immediate Priorities (Next 2 Weeks)

**Week 1: Complete Phase 3**
1. ✅ **Day 1-2**: Implement scheduled triggers for trend forecasting (6 hours)
2. ✅ **Day 3-4**: Add unit test suite with 80% coverage (2 days)
3. ✅ **Day 5**: Input validation enhancements (6 hours)

**Week 2: Start Phase 4**
4. ✅ **Day 6-8**: Implement scenario simulation modals (12 hours)
5. ✅ **Day 9-10**: Automatic task creation for approvals (8 hours)

### Medium-Term Roadmap (Next 1-2 Months)

**Month 1: Quality & Integration**
- Switch to real weather/port APIs (1 day)
- Performance optimization for scale (2-3 days)
- User documentation creation (2 days)
- Error handling improvements (4 hours)

**Month 2: Advanced Features**
- Command palette integration (2 hours)
- Real-time sync with polling (1 day)
- Jira issue actions for quick analysis (2 hours)
- Developer API documentation (1 day)

### Long-Term Roadmap (3-6 Months)

**Phase 5: Enterprise Features**
- Multi-language support enhancements (3 days)
- Advanced analytics dashboards (1 week)

---

## Part 8: Risk Assessment

### High Risk Items Requiring Attention

1. **Zero Test Coverage** 🔴
   - **Risk**: Production bugs, regression issues
   - **Mitigation**: Implement unit tests immediately (Week 1)

2. **Mock APIs in Production** 🔴
   - **Risk**: Unreliable data for decision-making
   - **Mitigation**: Switch to real APIs with fallback logic (Month 1)

3. **No Rate Limiting** 🟡
   - **Risk**: DOS vulnerability
   - **Mitigation**: Implement rate limiter (Week 1)

4. **Limited Error Recovery** 🟡
   - **Risk**: Poor user experience on failures
   - **Mitigation**: Add retry logic and graceful degradation (Month 1)

### Low Risk Items (Monitor)

1. **Performance at Scale** 🟢
   - Current implementation handles up to ~1000 shipments
   - Monitor and optimize if scaling beyond 5000 shipments

2. **Documentation Gaps** 🟢
   - Users can still use the app, but onboarding is harder
   - Create docs gradually (Month 1-2)

---

## Part 9: Success Metrics

### Key Performance Indicators (KPIs)

**Technical KPIs**
- [ ] Test coverage: ≥80% for critical functions
- [ ] API response time: <2 seconds for compliance validation
- [ ] Hash chain verification: 100% accuracy
- [ ] Uptime: 99.5% availability

**Feature Completeness KPIs**
- [ ] Phase 3: 100% complete (currently 75%)
- [ ] Phase 4: 60% complete by end of Month 2
- [ ] README.md feature parity: 90% (currently 80%)

**User Experience KPIs**
- [ ] Form load time: <2 seconds
- [ ] Dashboard refresh: <3 seconds
- [ ] Zero UI Kit component errors in logs
- [ ] All resolvers respond with proper error messages

---

## Appendix A: Quick Reference Checklist

### Phase 3 Completion Checklist
- [ ] Scheduled triggers for trend forecasting
- [ ] Forecast data displayed in dashboard
- [ ] Optional: Jira issue actions
- [ ] Optional: Project settings page

### Phase 4 Priority Checklist
- [ ] Scenario simulation modal UI
- [ ] Simulation resolver with delta calculations
- [ ] Automatic JSM task creation
- [ ] Approval workflow integration
- [ ] Command palette commands (optional)

### Quality Checklist
- [ ] Unit tests: validateCompliance (90% coverage)
- [ ] Unit tests: calculateEmissions (85% coverage)
- [ ] Unit tests: Hash chain utilities (95% coverage)
- [ ] Integration tests: Resolvers (70% coverage)
- [ ] Input sanitization with validator library
- [ ] Rate limiting implemented
- [ ] Structured logging utility
- [ ] Error recovery with retries

### Integration Checklist
- [ ] Real weather API configured
- [ ] Real port status API configured
- [ ] API keys stored via Forge variables
- [ ] Egress permissions added to manifest
- [ ] USE_REAL_APIS environment variable set

### Documentation Checklist
- [ ] User guide: Getting Started
- [ ] User guide: Entering Shipment Data
- [ ] User guide: Understanding Validations
- [ ] Developer guide: API Reference
- [ ] Developer guide: Architecture Diagram
- [ ] Inline help text in all forms

---

## Appendix B: Estimated Timeline Summary

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| **Phase 3 Completion** | Scheduled triggers, optional enhancements | 6-10 hours | HIGH |
| **Phase 4 Critical** | Scenario simulations, task automation | 20-24 hours | HIGH |
| **Testing Suite** | Unit tests, integration tests | 2-3 days | HIGH |
| **Input Validation** | Sanitization, rate limiting | 6-8 hours | HIGH |
| **External APIs** | Real weather/port integration | 1 day | MEDIUM |
| **Performance** | Query optimization, caching | 2-3 days | LOW |
| **Documentation** | User + developer guides | 3-4 days | MEDIUM |
| **Phase 4 Optional** | Command palette, real-time sync | 2-3 days | LOW |

**Total Estimated Effort**: 15-20 days of focused development

---

## Conclusion

LogiBrew has achieved strong Phase 1-2 completion with solid architecture and most critical bugs resolved. The next development phase focuses on:

1. **Completing Phase 3** (scheduled triggers + optional enhancements)
2. **Implementing Phase 4 critical features** (simulations, task automation)
3. **Building quality infrastructure** (tests, validation, error handling)
4. **Preparing for production** (real APIs, documentation, performance)

The roadmap balances feature development with quality improvements, ensuring LogiBrew meets both functional requirements from README.md and technical standards from AGENTS.md. All new features leverage existing UI Kit components from UI-kit.md and follow established module patterns from Modules.md.

**Recommended Next Action**: Start with Week 1 priorities (scheduled triggers + unit tests) to complete Phase 3 and establish quality baseline before advancing to Phase 4.

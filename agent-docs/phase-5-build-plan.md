# Phase 5 Build Plan: Advanced Features

**Created**: December 21, 2025  
**Status**: Planning  
**Target Completion**: TBD

## Overview

Phase 5 focuses on three major enhancements to transform LogiBrew from a functional MVP into a production-ready, feature-rich logistics intelligence platform:

1. **Advanced Analytics Dashboard** - Predictive insights beyond basic trend forecasting
2. **External API Integration** - Real-time data from weather, port, and regulatory sources
3. **Enhanced UI Components** - Custom UI for complex visualizations and interactions

## Phase 5 Objectives

### Business Goals
- Provide actionable predictive insights to reduce disruption response time by 30%
- Enable real-time decision-making with live external data feeds
- Improve user experience with interactive visualizations and scenario modeling

### Technical Goals
- Extend dashboard with ML-style pattern recognition and anomaly detection
- Integrate 3-5 external APIs with robust error handling and fallback mechanisms
- Implement Custom UI where UI Kit components are insufficient for advanced interactions

### Success Metrics
- Dashboard loads <3 seconds with 90-day historical data
- External API calls complete <2 seconds with 99% uptime (via fallback)
- User engagement: >50% of users interact with scenario simulation modals weekly

---

## Feature 1: Advanced Analytics Dashboard

### Current State (Phase 3)
- Basic 30-day trend forecasting (rolling average)
- Delay patterns by cause (top 5)
- Compliance rate and response time averages
- Recent activities table (last 10 entries)

### Target State (Phase 5)
- **90-day multi-dimensional analysis** with week-over-week comparisons
- **Anomaly detection** - flag unusual patterns (e.g., sudden spike in port delays)
- **Predictive forecasting** - 14-day forward projections using historical trends
- **Risk scoring** - shipment-level risk assessment (0-100 scale)
- **Interactive visualizations** - drill-down charts, date range selectors, export functionality

### Technical Specifications

#### 1.1 Extended Data Aggregation

**New Storage Structure**:
```javascript
// Forge Storage keys
'analytics-weekly-summary-{YYYY-WW}' → {
  weekStart: timestamp,
  weekEnd: timestamp,
  totalShipments: number,
  delayedShipments: number,
  compliancePassed: number,
  complianceFailed: number,
  avgResponseTime: number,
  delayCauses: [{ cause, count }],
  topRoutes: [{ origin, destination, count }],
  topCargo: [{ type, count }]
}

'analytics-daily-snapshot-{YYYY-MM-DD}' → {
  date: timestamp,
  shipments: number,
  delays: number,
  compliance: number,
  avgResponseTime: number
}
```

**Implementation**:
- Modify `scheduledTrendForecasting()` to generate both daily snapshots and weekly summaries
- Add new function `aggregateHistoricalData()` to consolidate 90-day trends
- Store weekly summaries for long-term trend analysis (reduce storage overhead)

#### 1.2 Anomaly Detection Algorithm

**Logic**:
```javascript
// Detect anomalies using Z-score (standard deviations from mean)
function detectAnomalies(metricHistory, currentValue, threshold = 2) {
  const mean = metricHistory.reduce((sum, val) => sum + val, 0) / metricHistory.length;
  const stdDev = Math.sqrt(
    metricHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / metricHistory.length
  );
  const zScore = (currentValue - mean) / stdDev;
  
  return {
    isAnomaly: Math.abs(zScore) > threshold,
    severity: Math.abs(zScore) > 3 ? 'critical' : Math.abs(zScore) > 2 ? 'high' : 'normal',
    zScore,
    baseline: mean,
    deviation: currentValue - mean
  };
}
```

**Application**:
- Monitor daily delay rates (anomaly if >2σ from 30-day average)
- Track compliance failures (flag if sudden increase)
- Detect response time spikes (alert if >2σ from weekly baseline)

#### 1.3 Predictive Forecasting (14-Day Forward)

**Method**: Linear regression on historical trends
```javascript
// Simple linear regression for trend projection
function predictNextDays(historicalData, daysToPredict = 14) {
  // historicalData: [{ date, value }]
  const n = historicalData.length;
  
  // Convert dates to numeric (days since first data point)
  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => d.value);
  
  // Calculate slope (m) and intercept (b) for y = mx + b
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  
  // Project forward
  const predictions = [];
  for (let i = n; i < n + daysToPredict; i++) {
    predictions.push({
      date: new Date(Date.now() + (i - n + 1) * 24 * 60 * 60 * 1000),
      predictedValue: m * i + b,
      confidence: 'medium' // TODO: Add confidence intervals
    });
  }
  
  return predictions;
}
```

**Forecasts**:
- Delay rate projection (next 14 days)
- Compliance rate trend
- Expected shipment volume
- Response time trajectory

#### 1.4 Risk Scoring Engine

**Factors** (weighted average):
```javascript
function calculateShipmentRisk(shipment, historicalContext) {
  const factors = {
    routeDelayHistory: 0.25,      // Historical delays on this route
    cargoComplexity: 0.20,         // Hazmat/perishable = higher risk
    complianceIssues: 0.25,        // Past compliance failures
    timelineConstraints: 0.15,     // Tight deadlines = higher risk
    externalFactors: 0.15          // Weather, port congestion (from APIs)
  };
  
  let riskScore = 0;
  
  // Route history (0-100, higher = more risky)
  const routeKey = `${shipment.origin}-${shipment.destination}`;
  const routeDelays = historicalContext.routeDelays[routeKey] || 0;
  riskScore += (routeDelays / historicalContext.avgDelays) * 100 * factors.routeDelayHistory;
  
  // Cargo complexity
  const cargoRisk = shipment.cargoType === 'hazmat' ? 80 :
                    shipment.cargoType === 'perishable' ? 60 :
                    shipment.cargoType === 'temperature-controlled' ? 40 : 20;
  riskScore += cargoRisk * factors.cargoComplexity;
  
  // Compliance issues
  const complianceRisk = shipment.complianceWarnings ? 70 : 
                         shipment.complianceIssues ? 100 : 10;
  riskScore += complianceRisk * factors.complianceIssues;
  
  // Timeline constraints (days until delivery)
  const daysUntilDelivery = (shipment.deliveryDate - Date.now()) / (1000 * 60 * 60 * 24);
  const timelineRisk = daysUntilDelivery < 2 ? 90 : 
                       daysUntilDelivery < 5 ? 60 :
                       daysUntilDelivery < 10 ? 30 : 10;
  riskScore += timelineRisk * factors.timelineConstraints;
  
  // External factors (from APIs)
  const externalRisk = shipment.weatherAlerts ? 80 :
                       shipment.portCongestion > 24 ? 70 : 20;
  riskScore += externalRisk * factors.externalFactors;
  
  return Math.min(100, Math.round(riskScore));
}
```

**Risk Levels**:
- 0-30: Low (green badge)
- 31-60: Medium (yellow badge)
- 61-80: High (orange badge)
- 81-100: Critical (red badge)

#### 1.5 Dashboard UI Enhancements

**New Components** (UI Kit):
- `LineChart` with multiple data series (historical vs. predicted)
- `BarChart` with stacked bars (compliance pass/fail breakdown)
- `DynamicTable` with sorting, filtering, pagination
- `DatePicker` range selector for custom time periods
- `Select` dropdown for metric selection (delays/compliance/response time)
- `Button` for export to CSV/JSON

**Layout**:
```jsx
<Stack space="space.300">
  {/* Header with filters */}
  <Inline space="space.200" alignBlock="center">
    <Heading size="large">Advanced Analytics</Heading>
    <DatePicker label="From" />
    <DatePicker label="To" />
    <Select label="Metric">
      <option value="delays">Delay Patterns</option>
      <option value="compliance">Compliance Rates</option>
      <option value="response">Response Times</option>
    </Select>
    <Button appearance="primary" onClick={refreshData}>Refresh</Button>
    <Button onClick={exportData}>Export CSV</Button>
  </Inline>
  
  {/* Anomaly alerts */}
  {anomalies.length > 0 && (
    <SectionMessage appearance="error" title="Anomalies Detected">
      {anomalies.map(a => <Text key={a.id}>{a.message}</Text>)}
    </SectionMessage>
  )}
  
  {/* Predictive forecast chart */}
  <Stack space="space.100">
    <Heading size="medium">14-Day Forecast</Heading>
    <LineChart data={forecastData} height={300} />
  </Stack>
  
  {/* Risk scoring table */}
  <Stack space="space.100">
    <Heading size="medium">High-Risk Shipments</Heading>
    <DynamicTable
      head={{ cells: [
        { content: 'Shipment ID' },
        { content: 'Route' },
        { content: 'Risk Score' },
        { content: 'Factors' }
      ]}}
      rows={riskTableRows}
    />
  </Stack>
  
  {/* Week-over-week comparison */}
  <Stack space="space.100">
    <Heading size="medium">Weekly Trends</Heading>
    <BarChart data={weeklyComparisonData} height={250} />
  </Stack>
</Stack>
```

### Implementation Tasks

**Task 1.1**: Extend scheduled trigger for daily snapshots (1-2 hours)
- Modify `scheduledTrendForecasting()` to create daily snapshots
- Add weekly summary aggregation logic
- Store in Forge Storage with date-based keys

**Task 1.2**: Implement anomaly detection (2-3 hours)
- Create `detectAnomalies()` function with Z-score calculation
- Integrate into dashboard resolver
- Add anomaly alerts to UI

**Task 1.3**: Build predictive forecasting (3-4 hours)
- Implement linear regression for trend projection
- Create 14-day forward predictions
- Add confidence intervals (optional)

**Task 1.4**: Develop risk scoring engine (2-3 hours)
- Create `calculateShipmentRisk()` function
- Integrate with dashboard resolver
- Add risk-based sorting to DynamicTable

**Task 1.5**: Enhance dashboard UI (3-4 hours)
- Add date range selectors
- Implement multi-series LineChart for forecasts
- Create export functionality (CSV/JSON)
- Add sorting/filtering to DynamicTable

**Total Estimated Time**: 11-16 hours

---

## Feature 2: External API Integration

### Current State
- Mock APIs in `reference/mockApis.js` (weather, port, UN codes, emissions)
- `USE_REAL_APIS=false` environment variable for switching
- No real API implementations (only templates)

### Target State
- **Live integrations** with 3-5 external data sources
- **Robust error handling** with automatic fallback to mocks
- **Rate limiting** and caching to minimize API costs
- **Secure key management** via Forge environment variables

### API Selection Criteria
1. **Reliability**: 99%+ uptime SLA
2. **Free tier**: At least 1000 requests/month
3. **No authentication complexity**: API key or OAuth only (no custom schemes)
4. **Relevant data**: Weather, port status, regulatory databases, emissions calculators

### Selected APIs

#### 2.1 OpenWeatherMap API (Weather Data)

**Purpose**: Real-time weather conditions for route planning

**Endpoint**: `https://api.openweathermap.org/data/2.5/weather`

**Free Tier**: 1000 calls/day, 60 calls/minute

**Required Scopes** (manifest.yml):
```yaml
permissions:
  external:
    fetch:
      backend:
        - 'api.openweathermap.org'
```

**Implementation**:
```javascript
async function getWeatherData(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      location,
      timestamp: Date.now(),
      temperature: data.main.temp,
      conditions: data.weather[0].main.toLowerCase(),
      windSpeed: data.wind.speed * 3.6, // m/s to km/h
      visibility: data.visibility > 5000 ? 'good' : 'moderate',
      alerts: data.weather[0].description.includes('storm') ? ['Storm conditions'] : [],
      source: 'OPENWEATHER_API',
      reliable: true
    };
  } catch (error) {
    console.error(`Real weather API failed: ${error.message}`);
    // Fallback to mock
    return await mockWeatherAPI(location);
  }
}
```

**Caching Strategy**:
- Cache weather data for 1 hour (weather changes slowly)
- Store in Forge Storage: `weather-cache-{location}-{hourTimestamp}`
- Check cache before API call

#### 2.2 MarineTraffic API (Port Status)

**Purpose**: Port congestion and vessel traffic data

**Endpoint**: `https://services.marinetraffic.com/api/portcalls`

**Free Tier**: 500 calls/month (limited)

**Alternative**: Use **AIS Hub** (free, community-based) or **Vessel Finder API**

**Implementation**:
```javascript
async function getPortStatus(portCode) {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  
  try {
    // MarineTraffic requires port LOCODE (e.g., SGSIN for Singapore)
    const response = await fetch(
      `https://services.marinetraffic.com/api/portcalls/${apiKey}/locode:${portCode}/protocol:jsono`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`Port API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Calculate congestion based on vessel count
    const vesselCount = data.length || 0;
    const congestion = vesselCount > 50 ? 'critical' :
                       vesselCount > 30 ? 'high' :
                       vesselCount > 15 ? 'moderate' : 'low';
    
    return {
      portCode,
      timestamp: Date.now(),
      congestion,
      averageDelay: vesselCount * 0.5, // Rough estimate: 0.5 hours per vessel
      berths: { available: Math.max(0, 10 - Math.floor(vesselCount / 5)), total: 10 },
      operations: congestion === 'critical' ? 'limited' : 'normal',
      restrictions: [],
      source: 'MARINETRAFFIC_API',
      reliable: true
    };
  } catch (error) {
    console.error(`Port API failed: ${error.message}`);
    return await mockPortStatusAPI(portCode);
  }
}
```

**Caching**: 6 hours (port status changes slowly)

#### 2.3 UN Dangerous Goods Database (Regulatory)

**Purpose**: Validate UN codes against official IATA/IMDG classifications

**Options**:
- **IATA DGR API** (paid, official)
- **Open DG Database** (free, community-maintained) - `https://unece.org/dangerous-goods`
- **Fallback**: Use embedded `rules.json` (already implemented)

**Recommendation**: Keep `rules.json` as primary source (no API needed), update quarterly

#### 2.4 Carbon Interface API (Emissions)

**Purpose**: Accurate carbon emission calculations with real-time factors

**Endpoint**: `https://www.carboninterface.com/api/v1/estimates`

**Free Tier**: 200 requests/month

**Implementation**:
```javascript
async function calculateEmissionsWithAPI(shipment) {
  const apiKey = process.env.CARBON_INTERFACE_KEY;
  
  try {
    const response = await fetch(
      'https://www.carboninterface.com/api/v1/estimates',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'shipping',
          weight_value: shipment.weight,
          weight_unit: 'kg',
          distance_value: shipment.distance,
          distance_unit: 'km',
          transport_method: shipment.transportMode
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Carbon API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      emissions: {
        total: data.data.attributes.carbon_kg,
        unit: 'kg_co2',
        breakdown: {
          weight: shipment.weight,
          distance: shipment.distance,
          transportMode: shipment.transportMode,
          emissionFactor: data.data.attributes.estimated_at,
          source: 'CARBON_INTERFACE_API'
        }
      },
      compliance: checkEUETS(data.data.attributes.carbon_kg)
    };
  } catch (error) {
    console.error(`Carbon API failed: ${error.message}`);
    // Fallback to rule-based calculation
    return await calculateEmissions(shipment);
  }
}
```

**Caching**: 24 hours (emission factors change rarely)

#### 2.5 Geocoding API (Distance Calculation)

**Purpose**: Calculate accurate distances between origin/destination

**Options**:
- **OpenCage Geocoding** (2500 requests/day free)
- **Nominatim** (OpenStreetMap, free, rate-limited to 1 req/sec)

**Implementation**:
```javascript
async function calculateDistance(origin, destination) {
  const apiKey = process.env.OPENCAGE_API_KEY;
  
  try {
    // Geocode origin
    const originResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(origin)}&key=${apiKey}`
    );
    const originData = await originResponse.json();
    const originCoords = originData.results[0].geometry;
    
    // Geocode destination
    const destResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(destination)}&key=${apiKey}`
    );
    const destData = await destResponse.json();
    const destCoords = destData.results[0].geometry;
    
    // Haversine formula for great-circle distance
    const distance = haversineDistance(
      originCoords.lat, originCoords.lng,
      destCoords.lat, destCoords.lng
    );
    
    return {
      origin,
      destination,
      distance, // in km
      source: 'OPENCAGE_API'
    };
  } catch (error) {
    console.error(`Geocoding failed: ${error.message}`);
    // Fallback to mock estimation
    return { distance: 1000 + Math.random() * 9000 };
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

**Caching**: Permanent (origin-destination pairs don't change)

### API Integration Architecture

**Fallback Hierarchy**:
1. **Check cache** (Forge Storage)
2. **Call real API** (with retry logic)
3. **Fallback to mock** (if API fails)
4. **Log failure** for monitoring

**Error Handling Pattern**:
```javascript
async function fetchWithFallback(apiName, realApiFn, mockFn, ...args) {
  const cacheKey = `api-cache-${apiName}-${JSON.stringify(args)}`;
  
  // 1. Check cache
  const cached = await storage.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`${apiName}: Using cached data`);
    return cached.data;
  }
  
  // 2. Try real API
  try {
    const data = await realApiFn(...args);
    
    // Cache successful result
    await storage.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: getTTL(apiName) // API-specific cache duration
    });
    
    return data;
  } catch (error) {
    console.error(`${apiName} failed: ${error.message}`);
    
    // 3. Fallback to mock
    console.log(`${apiName}: Using mock fallback`);
    const mockData = await mockFn(...args);
    return { ...mockData, fallback: true };
  }
}
```

**Rate Limiting**:
```javascript
// Simple in-memory rate limiter
const rateLimits = {
  'openweather': { limit: 60, window: 60000, calls: [] }, // 60/min
  'marinetraffic': { limit: 10, window: 60000, calls: [] } // Conservative
};

async function rateLimitedFetch(apiName, fetchFn) {
  const limiter = rateLimits[apiName];
  const now = Date.now();
  
  // Remove calls outside window
  limiter.calls = limiter.calls.filter(time => now - time < limiter.window);
  
  if (limiter.calls.length >= limiter.limit) {
    const oldestCall = Math.min(...limiter.calls);
    const waitTime = limiter.window - (now - oldestCall);
    throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
  }
  
  limiter.calls.push(now);
  return await fetchFn();
}
```

### Implementation Tasks

**Task 2.1**: Set up API credentials (1 hour)
- Sign up for OpenWeatherMap, MarineTraffic, Carbon Interface, OpenCage
- Generate API keys
- Store in Forge environment variables: `forge variables set --encrypt`

**Task 2.2**: Update manifest.yml with egress domains (0.5 hours)
- Add all API domains to `permissions.external.fetch.backend`

**Task 2.3**: Implement real API functions (4-6 hours)
- Create `realWeatherApiCall()`, `realPortStatusCall()`, etc.
- Add error handling and fallback logic
- Implement caching layer

**Task 2.4**: Build rate limiting and monitoring (2-3 hours)
- Implement rate limiter for each API
- Add logging for API failures
- Create admin dashboard for API health monitoring

**Task 2.5**: Update action handlers to use real APIs (2 hours)
- Modify `validateCompliance()` to use real UN code API (if available)
- Update `calculateEmissions()` to use Carbon Interface
- Enhance weather/port actions

**Task 2.6**: Testing and fallback validation (2-3 hours)
- Test real APIs with valid/invalid inputs
- Verify fallback to mocks on failures
- Load test rate limiting

**Total Estimated Time**: 11.5-15.5 hours

---

## Feature 3: Enhanced UI Components

### Current State
- UI Kit components only (`@forge/react`)
- Basic forms, tables, charts
- No custom interactions beyond UI Kit capabilities

### Target State
- **Custom UI** for complex scenarios where UI Kit is insufficient
- **Scenario simulation modals** with interactive "what-if" analysis
- **Advanced visualizations** (network graphs, heat maps)
- **Real-time updates** via WebSockets (if Forge supports) or polling

### When to Use Custom UI vs. UI Kit

**Use UI Kit** (default):
- Standard forms, tables, charts
- Simple interactions (buttons, dropdowns, date pickers)
- Quick development, consistent Atlassian look & feel

**Use Custom UI** (only when necessary):
- Complex interactions UI Kit doesn't support (drag-and-drop, canvas drawing)
- Advanced visualizations (D3.js charts, network graphs)
- Real-time collaboration features
- Custom animations or transitions

### Scenario Simulation Modal (Custom UI)

**Purpose**: Interactive "what-if" analysis for disruption scenarios

**User Flow**:
1. User clicks "Simulate Disruption" button in Jira issue panel
2. Modal opens with scenario configuration form
3. User adjusts parameters (delay days, route change, mode switch)
4. Real-time calculation shows impact (cost, timeline, emissions)
5. User saves scenario or applies changes to issue

**UI Design**:
```jsx
// Custom UI component in static/scenario-simulator/
import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

function ScenarioSimulator({ shipmentId }) {
  const [scenario, setScenario] = useState({
    delayDays: 0,
    routeChange: false,
    newOrigin: '',
    newDestination: '',
    modeSwitch: false,
    newMode: 'sea'
  });
  
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Real-time impact calculation
  useEffect(() => {
    const calculateImpact = async () => {
      setLoading(true);
      const result = await invoke('simulateScenario', {
        shipmentId,
        scenario
      });
      setImpact(result);
      setLoading(false);
    };
    
    const debounce = setTimeout(calculateImpact, 500);
    return () => clearTimeout(debounce);
  }, [scenario]);
  
  return (
    <div className="scenario-simulator">
      <h2>Scenario Simulation</h2>
      
      {/* Delay slider */}
      <label>
        Delay (days):
        <input
          type="range"
          min="0"
          max="30"
          value={scenario.delayDays}
          onChange={(e) => setScenario({ ...scenario, delayDays: e.target.value })}
        />
        <span>{scenario.delayDays} days</span>
      </label>
      
      {/* Route change toggle */}
      <label>
        <input
          type="checkbox"
          checked={scenario.routeChange}
          onChange={(e) => setScenario({ ...scenario, routeChange: e.target.checked })}
        />
        Change route
      </label>
      
      {scenario.routeChange && (
        <div>
          <input
            type="text"
            placeholder="New origin"
            value={scenario.newOrigin}
            onChange={(e) => setScenario({ ...scenario, newOrigin: e.target.value })}
          />
          <input
            type="text"
            placeholder="New destination"
            value={scenario.newDestination}
            onChange={(e) => setScenario({ ...scenario, newDestination: e.target.value })}
          />
        </div>
      )}
      
      {/* Mode switch */}
      <label>
        <input
          type="checkbox"
          checked={scenario.modeSwitch}
          onChange={(e) => setScenario({ ...scenario, modeSwitch: e.target.checked })}
        />
        Switch transport mode
      </label>
      
      {scenario.modeSwitch && (
        <select
          value={scenario.newMode}
          onChange={(e) => setScenario({ ...scenario, newMode: e.target.value })}
        >
          <option value="air">Air</option>
          <option value="sea">Sea</option>
          <option value="road">Road</option>
          <option value="rail">Rail</option>
        </select>
      )}
      
      {/* Impact display */}
      {loading ? (
        <div className="spinner">Calculating...</div>
      ) : impact ? (
        <div className="impact-summary">
          <h3>Impact Analysis</h3>
          <div className="impact-grid">
            <div className="metric">
              <span className="label">Cost Impact</span>
              <span className={`value ${impact.costChange > 0 ? 'negative' : 'positive'}`}>
                {impact.costChange > 0 ? '+' : ''}{impact.costChange}%
              </span>
            </div>
            <div className="metric">
              <span className="label">Timeline Impact</span>
              <span className={`value ${impact.timelineChange > 0 ? 'negative' : 'positive'}`}>
                {impact.timelineChange > 0 ? '+' : ''}{impact.timelineChange} days
              </span>
            </div>
            <div className="metric">
              <span className="label">Emissions Impact</span>
              <span className={`value ${impact.emissionsChange > 0 ? 'negative' : 'positive'}`}>
                {impact.emissionsChange > 0 ? '+' : ''}{impact.emissionsChange}%
              </span>
            </div>
            <div className="metric">
              <span className="label">Compliance Status</span>
              <span className={`value ${impact.complianceValid ? 'positive' : 'negative'}`}>
                {impact.complianceValid ? 'Valid' : 'Issues'}
              </span>
            </div>
          </div>
          
          {impact.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Recommendations</h4>
              <ul>
                {impact.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
      
      {/* Actions */}
      <div className="actions">
        <button onClick={() => applyScenario(scenario)}>Apply Changes</button>
        <button onClick={() => saveScenario(scenario)}>Save Scenario</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

**Backend Resolver**:
```javascript
// In src/index.js
scenarioResolverInstance.define('simulateScenario', async (req) => {
  const { shipmentId, scenario } = req.payload;
  
  // Fetch original shipment data
  const shipmentKey = `shipment-${shipmentId}-data`;
  const original = await storage.get(shipmentKey);
  
  if (!original) {
    return { error: 'Shipment not found' };
  }
  
  // Apply scenario modifications
  const modified = { ...original };
  
  if (scenario.delayDays > 0) {
    modified.deliveryDate = new Date(
      new Date(original.deliveryDate).getTime() + scenario.delayDays * 24 * 60 * 60 * 1000
    );
  }
  
  if (scenario.routeChange) {
    modified.origin = scenario.newOrigin;
    modified.destination = scenario.newDestination;
  }
  
  if (scenario.modeSwitch) {
    modified.transportMode = scenario.newMode;
  }
  
  // Calculate impact
  const originalCost = estimateCost(original);
  const modifiedCost = estimateCost(modified);
  
  const originalEmissions = await calculateEmissions({
    origin: original.origin,
    destination: original.destination,
    transportMode: original.transportMode,
    weight: original.weight,
    distance: original.distance
  });
  
  const modifiedEmissions = await calculateEmissions({
    origin: modified.origin,
    destination: modified.destination,
    transportMode: modified.transportMode,
    weight: modified.weight,
    distance: modified.distance
  });
  
  const compliance = await validateCompliance({
    unCode: modified.unCode,
    transportMode: modified.transportMode,
    cargoType: modified.cargoType,
    weight: modified.weight
  });
  
  return {
    costChange: ((modifiedCost - originalCost) / originalCost) * 100,
    timelineChange: scenario.delayDays,
    emissionsChange: ((modifiedEmissions.emissions.total - originalEmissions.emissions.total) / 
                     originalEmissions.emissions.total) * 100,
    complianceValid: compliance.isValid,
    recommendations: generateRecommendations(original, modified, compliance)
  };
});

function estimateCost(shipment) {
  // Simple cost model: base + distance + mode multiplier
  const baseCost = 100;
  const distanceCost = shipment.distance * 0.1;
  const modeMultiplier = {
    air: 5,
    sea: 1,
    road: 2,
    rail: 1.5
  };
  
  return baseCost + distanceCost * modeMultiplier[shipment.transportMode];
}

function generateRecommendations(original, modified, compliance) {
  const recs = [];
  
  if (modified.transportMode !== original.transportMode) {
    recs.push(`Switching to ${modified.transportMode} may require different packaging`);
  }
  
  if (!compliance.isValid) {
    recs.push('Compliance issues detected - review restrictions before proceeding');
  }
  
  if (modified.deliveryDate > original.deliveryDate) {
    recs.push('Consider notifying stakeholders of timeline changes');
  }
  
  return recs;
}
```

### Network Graph Visualization (Custom UI)

**Purpose**: Visualize shipment routes and connections between locations

**Library**: D3.js or Vis.js

**Implementation**:
```jsx
// static/network-graph/index.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function RouteNetworkGraph({ routes }) {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!routes || routes.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;
    
    // Build nodes (unique locations)
    const locations = new Set();
    routes.forEach(r => {
      locations.add(r.origin);
      locations.add(r.destination);
    });
    
    const nodes = Array.from(locations).map(loc => ({ id: loc }));
    
    // Build links (routes)
    const links = routes.map(r => ({
      source: r.origin,
      target: r.destination,
      value: r.volume || 1
    }));
    
    // D3 force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Draw links
    svg.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-width', d => Math.sqrt(d.value));
    
    // Draw nodes
    svg.selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', '#69b3a2')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));
    
    // Add labels
    svg.selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', 12)
      .attr('dx', 15)
      .attr('dy', 4);
    
    // Update positions on tick
    simulation.on('tick', () => {
      svg.selectAll('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      svg.selectAll('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      svg.selectAll('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
    
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [routes]);
  
  return <svg ref={svgRef} width="800" height="600"></svg>;
}
```

### Implementation Tasks

**Task 3.1**: Set up Custom UI for scenario simulator (2-3 hours)
- Create `static/scenario-simulator/` directory
- Build React component with interactive controls
- Add CSS for styling

**Task 3.2**: Implement scenario simulation resolver (3-4 hours)
- Create `simulateScenario` backend function
- Add cost estimation logic
- Build recommendation engine

**Task 3.3**: Integrate simulator into issue panel (1-2 hours)
- Add "Simulate Disruption" button to shipment panel
- Open Custom UI modal on click
- Handle save/apply actions

**Task 3.4**: Build network graph visualization (4-5 hours)
- Set up D3.js or Vis.js
- Create route network graph component
- Add to global page or dashboard

**Task 3.5**: Add real-time updates (optional) (2-3 hours)
- Implement polling for live data updates
- Add WebSocket support if Forge allows
- Update UI components reactively

**Total Estimated Time**: 12-17 hours

---

## Testing Strategy

### Unit Tests
- Test anomaly detection algorithm with known data sets
- Validate predictive forecasting accuracy (RMSE < 10%)
- Test risk scoring with edge cases

### Integration Tests
- Test real API calls with valid/invalid inputs
- Verify fallback mechanisms trigger correctly
- Test rate limiting under load

### End-to-End Tests
- User creates shipment → Dashboard shows analytics
- User simulates scenario → Impact calculated correctly
- External API failure → Mock fallback works seamlessly

### Performance Tests
- Dashboard loads <3s with 90-day data
- API calls complete <2s
- Scenario simulation responds <500ms

---

## Deployment Plan

### Pre-Deployment Checklist
- [ ] All unit tests passing
- [ ] API keys configured in Forge environment
- [ ] Manifest.yml updated with egress domains
- [ ] Custom UI bundles built and included in static/
- [ ] Documentation updated (TESTING.md, README.md)

### Deployment Steps
1. **Update manifest.yml** with new modules and egress permissions
2. **Run `forge lint`** to validate changes
3. **Deploy to development**: `forge deploy --non-interactive -e development`
4. **Reinstall with upgrade**: `forge install --upgrade` (new scopes)
5. **Test each feature** in sandbox environment
6. **Monitor API usage** and error rates
7. **Deploy to production** after validation

### Rollback Plan
- Keep Phase 4 deployed as fallback
- If API failures exceed 10%, revert to mock-only mode
- Document issues and retry deployment after fixes

---

## Success Criteria

### Phase 5 Complete When:
- ✅ Advanced analytics dashboard shows 90-day trends with anomaly detection
- ✅ 14-day predictive forecasts display with <15% error rate
- ✅ Risk scoring accurately identifies high-risk shipments (>80% precision)
- ✅ 3+ external APIs integrated with <5% failure rate (via fallback)
- ✅ Scenario simulation modal functional with real-time impact calculations
- ✅ All tests passing (85+ unit tests, 10+ integration tests)
- ✅ Dashboard loads <3 seconds with 90-day historical data
- ✅ User documentation complete

---

## Timeline Estimate

| Feature | Tasks | Estimated Hours | Priority |
|---------|-------|-----------------|----------|
| **Advanced Analytics** | 1.1-1.5 | 11-16 hours | High |
| **External APIs** | 2.1-2.6 | 11.5-15.5 hours | High |
| **Enhanced UI** | 3.1-3.5 | 12-17 hours | Medium |
| **Testing & QA** | All | 5-8 hours | High |
| **Documentation** | All | 2-3 hours | Medium |
| **Total** | - | **41.5-59.5 hours** | - |

**Recommended Approach**: Implement features sequentially (Analytics → APIs → UI) to validate each before moving to next.

**Target Completion**: 1-2 weeks with focused development sessions

---

## Dependencies & Risks

### Dependencies
- External API availability and free tier limits
- Forge platform limitations on Custom UI
- User feedback on dashboard usefulness

### Risks
1. **API rate limits exceeded** → Mitigation: Aggressive caching, fallback to mocks
2. **Custom UI performance issues** → Mitigation: Optimize rendering, lazy loading
3. **Predictive forecasting inaccurate** → Mitigation: Use simple linear regression, add confidence intervals
4. **User adoption low** → Mitigation: Provide clear documentation, example scenarios

---

## Next Steps

1. **Review and approve this plan** with stakeholders
2. **Set up API accounts** and generate keys
3. **Create feature branch**: `git checkout -b phase-5-advanced-features`
4. **Start with Task 1.1** (extend scheduled trigger for daily snapshots)
5. **Iterate with testing** after each major feature

---

**Document Version**: 1.0  
**Created By**: GitHub Copilot (AI Assistant)  
**Last Updated**: December 21, 2025

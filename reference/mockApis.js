/**
 * Mock External API Utilities for LogiBrew Demo/Development
 * 
 * Simulates external API responses for weather, port status, and regulatory data.
 * Use these mocks during development and demo deployments before integrating real APIs.
 * 
 * To switch to real APIs:
 * 1. Add egress permissions to manifest.yml for the API domain
 * 2. Redeploy and reinstall the app with --upgrade flag
 * 3. Replace mock functions with real API calls using fetch()
 * 4. Use environment variables for API keys (set via Forge CLI)
 * 
 * @module mockApis
 */

/**
 * Mock Weather API Response
 * 
 * Simulates weather condition data for route planning.
 * Real API integration: OpenWeatherMap, Weather.gov, or similar
 * 
 * @param {string} location - Location identifier (city name, coordinates, etc.)
 * @returns {Promise<Object>} Weather data
 * 
 * @example
 * const weather = await getWeatherData('Singapore');
 * // Returns: { temperature: 28, conditions: 'clear', windSpeed: 15, ... }
 */
export async function getWeatherData(location) {
  // Simulate API delay (50-200ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  
  // Mock weather conditions based on location hash
  const seed = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const conditions = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
  
  return {
    location,
    timestamp: Date.now(),
    temperature: 15 + (seed % 20), // 15-35°C
    conditions: conditions[seed % conditions.length],
    windSpeed: 5 + (seed % 30), // 5-35 km/h
    visibility: seed % 2 === 0 ? 'good' : 'moderate',
    alerts: seed % 5 === 0 ? ['Heavy rain expected in 6 hours'] : [],
    // Metadata for switching to real API
    source: 'MOCK_API',
    reliable: false
  };
}

/**
 * Mock Port Status API Response
 * 
 * Simulates port congestion and operational status.
 * Real API integration: Port authorities' APIs, MarineTraffic, etc.
 * 
 * @param {string} portCode - IATA/ICAO port code (e.g., 'SGSIN', 'NLRTM')
 * @returns {Promise<Object>} Port status data
 * 
 * @example
 * const status = await getPortStatus('SGSIN');
 * // Returns: { congestion: 'moderate', delays: 2, ... }
 */
export async function getPortStatus(portCode) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  
  const seed = portCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const congestionLevels = ['low', 'moderate', 'high', 'critical'];
  
  return {
    portCode,
    timestamp: Date.now(),
    congestion: congestionLevels[seed % congestionLevels.length],
    averageDelay: seed % 48, // 0-48 hours
    berths: {
      available: Math.max(1, 10 - (seed % 12)),
      total: 10
    },
    operations: seed % 3 === 0 ? 'limited' : 'normal',
    restrictions: seed % 4 === 0 ? ['Hazmat restrictions in effect'] : [],
    // Metadata for switching to real API
    source: 'MOCK_API',
    reliable: false
  };
}

/**
 * Mock Regulatory Compliance API Response
 * 
 * Simulates UN code validation and compliance checks.
 * Real API integration: IATA DGR API, regulatory databases
 * 
 * @param {string} unCode - UN hazardous material code (e.g., 'UN1234')
 * @param {string} transportMode - Transport mode ('air', 'sea', 'road', 'rail')
 * @returns {Promise<Object>} Compliance validation result
 * 
 * @example
 * const validation = await validateUnCode('UN1234', 'air');
 * // Returns: { isValid: true, restrictions: [...], ... }
 */
export async function validateUnCode(unCode, transportMode) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  
  // Mock validation logic
  const isValid = /^UN\d{4}$/.test(unCode);
  const seed = parseInt(unCode.replace('UN', ''), 10) || 0;
  
  return {
    unCode,
    transportMode,
    timestamp: Date.now(),
    isValid,
    classification: isValid ? `Class ${(seed % 9) + 1}` : 'Unknown',
    packingGroup: isValid ? ['I', 'II', 'III'][seed % 3] : null,
    restrictions: isValid ? [
      `Max quantity per package: ${seed % 100}kg`,
      transportMode === 'air' ? 'Forbidden on passenger aircraft' : null
    ].filter(Boolean) : [],
    specialProvisions: isValid ? [`SP-${seed % 999}`] : [],
    // Metadata for switching to real API
    source: 'MOCK_API',
    reliable: false
  };
}

/**
 * Mock Emission Calculation API Response
 * 
 * Simulates carbon emission calculations for compliance (e.g., EU ETS).
 * Real API integration: Carbon emission calculators, regulatory APIs
 * 
 * @param {Object} shipment - Shipment details
 * @param {string} shipment.origin - Origin location
 * @param {string} shipment.destination - Destination location
 * @param {string} shipment.mode - Transport mode ('air', 'sea', 'road', 'rail')
 * @param {number} shipment.weight - Cargo weight in kg
 * @returns {Promise<Object>} Emission calculation result
 * 
 * @example
 * const emissions = await calculateEmissions({
 *   origin: 'Singapore',
 *   destination: 'Rotterdam',
 *   mode: 'sea',
 *   weight: 5000
 * });
 */
export async function calculateEmissions(shipment) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  
  // Mock emission factors (kg CO2 per ton-km)
  const emissionFactors = {
    air: 0.5,
    sea: 0.01,
    road: 0.1,
    rail: 0.05
  };
  
  // Mock distance calculation (simplified)
  const distance = 1000 + Math.random() * 9000; // 1000-10000 km
  const factor = emissionFactors[shipment.mode] || 0.1;
  const tonKm = (shipment.weight / 1000) * distance;
  const totalEmissions = tonKm * factor;
  
  // EU ETS threshold (mock)
  const euEtsThreshold = 500; // kg CO2
  
  return {
    shipment,
    timestamp: Date.now(),
    distance: Math.round(distance),
    emissionFactor: factor,
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    exceedsThreshold: totalEmissions > euEtsThreshold,
    threshold: euEtsThreshold,
    complianceStatus: totalEmissions > euEtsThreshold ? 'reporting_required' : 'compliant',
    // Metadata for switching to real API
    source: 'MOCK_API',
    reliable: false
  };
}

/**
 * Helper: Switch from mock to real API
 * 
 * Environment-aware API caller that switches between mock and real APIs
 * based on environment variable configuration.
 * 
 * @param {string} apiType - API type ('weather', 'port', 'compliance', 'emissions')
 * @param {Function} mockFn - Mock function to use in development
 * @param {Function} realFn - Real API function to use in production
 * @param {...any} args - Arguments to pass to the API function
 * @returns {Promise<Object>} API response
 * 
 * @example
 * // In manifest.yml, set environment variable:
 * // app:
 * //   environment:
 * //     USE_REAL_APIS: 'true'
 * 
 * const weather = await apiSwitch(
 *   'weather',
 *   getWeatherData,
 *   realWeatherApiCall,
 *   'Singapore'
 * );
 */
export async function apiSwitch(apiType, mockFn, realFn, ...args) {
  // Check environment variable (set in manifest.yml or via Forge CLI)
  const useRealApis = process.env.USE_REAL_APIS === 'true';
  
  if (useRealApis && realFn) {
    console.log(`Using real ${apiType} API`);
    return await realFn(...args);
  } else {
    console.log(`Using mock ${apiType} API (set USE_REAL_APIS=true for production)`);
    return await mockFn(...args);
  }
}

/**
 * Example: Real Weather API Implementation
 * 
 * Template for implementing real API calls. Replace this with actual API integration.
 * 
 * Steps to implement:
 * 1. Add API domain to manifest.yml egress permissions:
 *    permissions:
 *      external:
 *        fetch:
 *          backend:
 *            - 'api.openweathermap.org'
 * 
 * 2. Set API key in environment:
 *    forge variables set --encrypt OPENWEATHER_API_KEY <your-key>
 * 
 * 3. Deploy and reinstall with --upgrade flag
 */
export async function realWeatherApiCall(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY not set. Use: forge variables set --encrypt OPENWEATHER_API_KEY <key>');
  }
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to LogiBrew format
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
    // Fallback to mock if real API fails
    return await getWeatherData(location);
  }
}

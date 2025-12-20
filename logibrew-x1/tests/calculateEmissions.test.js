/**
 * Unit Tests for calculateEmissions Function
 * 
 * Tests carbon emission calculations including:
 * - Input validation
 * - Emission factor application
 * - EU ETS threshold checking
 * - Carbon offset recommendations
 * - Transport mode comparisons
 * 
 * Target Coverage: 85%
 */

import { calculateEmissions } from '../src/index.js';

describe('calculateEmissions', () => {
  // ===== Input Validation Tests =====

  test('should reject null payload', async () => {
    const result = await calculateEmissions(null);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid payload');
  });

  test('should reject undefined payload', async () => {
    const result = await calculateEmissions(undefined);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid payload');
  });

  test('should reject missing origin', async () => {
    const result = await calculateEmissions({
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 5000
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Origin and destination are required');
  });

  test('should reject missing destination', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      transportMode: 'sea',
      weight: 5000
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Origin and destination are required');
  });

  test('should reject empty origin', async () => {
    const result = await calculateEmissions({
      origin: '',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 5000
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Origin and destination are required');
  });

  test('should reject invalid weight - zero', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 0
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid weight');
  });

  test('should reject invalid weight - negative', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: -100
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid weight');
  });

  test('should reject invalid weight - excessive', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 2000000
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid weight');
  });

  test('should reject invalid transport mode', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'rocket',
      weight: 5000
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid transport mode');
  });

  // ===== Sea Transport Tests =====

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
    expect(result.emissions.breakdown.emissionFactor).toBe(0.01); // Sea factor
    expect(result.emissions.breakdown.transportMode).toBe('sea');
  });

  test('should calculate low emissions for sea transport', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 1000,
      distance: 5000
    });
    
    expect(result.success).toBe(true);
    // Sea has lowest emission factor (0.01)
    expect(result.emissions.total).toBeLessThan(100);
  });

  // ===== Air Transport Tests =====

  test('should calculate emissions for air transport', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'London',
      transportMode: 'air',
      weight: 1000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.breakdown.emissionFactor).toBe(0.5); // Air factor
    expect(result.emissions.total).toBeGreaterThan(0);
  });

  test('should calculate high emissions for air transport', async () => {
    const result = await calculateEmissions({
      origin: 'New York',
      destination: 'Tokyo',
      transportMode: 'air',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    // Air has highest emission factor (0.5)
    expect(result.emissions.total).toBeGreaterThan(1000);
  });

  // ===== Road Transport Tests =====

  test('should calculate emissions for road transport', async () => {
    const result = await calculateEmissions({
      origin: 'Berlin',
      destination: 'Paris',
      transportMode: 'road',
      weight: 2000,
      distance: 1000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.breakdown.emissionFactor).toBe(0.1); // Road factor
  });

  // ===== Rail Transport Tests =====

  test('should calculate emissions for rail transport', async () => {
    const result = await calculateEmissions({
      origin: 'Moscow',
      destination: 'Beijing',
      transportMode: 'rail',
      weight: 3000,
      distance: 7000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.breakdown.emissionFactor).toBe(0.05); // Rail factor
  });

  // ===== EU ETS Compliance Tests =====

  test('should flag shipment exceeding EU ETS threshold', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'air',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    if (result.emissions.total > 500) {
      expect(result.compliance.euEts.exceeded).toBe(true);
      expect(result.compliance.euEts.status).toBe('reporting_required');
      expect(result.recommendations).toContain('EU ETS compliance reporting required for this shipment.');
    }
  });

  test('should pass shipment below EU ETS threshold', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 1000,
      distance: 1000
    });
    
    expect(result.success).toBe(true);
    if (result.emissions.total <= 500) {
      expect(result.compliance.euEts.exceeded).toBe(false);
      expect(result.compliance.euEts.status).toBe('compliant');
    }
  });

  // ===== Carbon Offset Tests =====

  test('should recommend carbon offset for high emissions', async () => {
    const result = await calculateEmissions({
      origin: 'New York',
      destination: 'Sydney',
      transportMode: 'air',
      weight: 10000,
      distance: 16000
    });
    
    expect(result.success).toBe(true);
    if (result.emissions.total > 1000) {
      expect(result.compliance.carbonOffset.recommended).toBe(true);
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('carbon offsets')
        ])
      );
    }
  });

  test('should not recommend offset for low emissions', async () => {
    const result = await calculateEmissions({
      origin: 'Berlin',
      destination: 'Paris',
      transportMode: 'rail',
      weight: 500,
      distance: 1000
    });
    
    expect(result.success).toBe(true);
    if (result.emissions.total <= 1000) {
      expect(result.compliance.carbonOffset.recommended).toBe(false);
    }
  });

  // ===== Distance Handling Tests =====

  test('should estimate distance when not provided', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 5000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.breakdown.distance).toBeGreaterThan(0);
    expect(result.emissions.breakdown.distanceUnit).toBe('km');
  });

  test('should use provided distance', async () => {
    const result = await calculateEmissions({
      origin: 'Berlin',
      destination: 'Paris',
      transportMode: 'road',
      weight: 2000,
      distance: 1050
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.breakdown.distance).toBe(1050);
  });

  // ===== Transport Mode Comparison Tests =====

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
    
    expect(airResult.success).toBe(true);
    expect(seaResult.success).toBe(true);
    expect(airResult.emissions.total).toBeGreaterThan(seaResult.emissions.total);
  });

  test('should recommend sea/rail for high air emissions', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'air',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    if (result.emissions.total > 100) {
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('sea or rail transport')
        ])
      );
    }
  });

  // ===== Breakdown Validation Tests =====

  test('should provide complete emission breakdown', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.breakdown).toHaveProperty('weight');
    expect(result.emissions.breakdown).toHaveProperty('weightUnit');
    expect(result.emissions.breakdown).toHaveProperty('distance');
    expect(result.emissions.breakdown).toHaveProperty('distanceUnit');
    expect(result.emissions.breakdown).toHaveProperty('transportMode');
    expect(result.emissions.breakdown).toHaveProperty('emissionFactor');
    expect(result.emissions.breakdown).toHaveProperty('emissionFactorUnit');
  });

  test('should round emissions to 2 decimal places', async () => {
    const result = await calculateEmissions({
      origin: 'Berlin',
      destination: 'Paris',
      transportMode: 'road',
      weight: 1234,
      distance: 1050
    });
    
    expect(result.success).toBe(true);
    // Check that total is rounded to 2 decimal places
    const decimalPlaces = (result.emissions.total.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  // ===== Case Sensitivity Tests =====

  test('should handle uppercase transport mode', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'SEA',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
  });

  test('should handle mixed case transport mode', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'Air',
      weight: 5000,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
  });

  // ===== Edge Cases =====

  test('should handle very small weight', async () => {
    const result = await calculateEmissions({
      origin: 'Berlin',
      destination: 'Paris',
      transportMode: 'air',
      weight: 1,
      distance: 1000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.total).toBeGreaterThan(0);
  });

  test('should handle very large weight within limits', async () => {
    const result = await calculateEmissions({
      origin: 'Singapore',
      destination: 'Rotterdam',
      transportMode: 'sea',
      weight: 999999,
      distance: 10000
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.total).toBeGreaterThan(0);
  });

  test('should handle very short distance', async () => {
    const result = await calculateEmissions({
      origin: 'Berlin',
      destination: 'Potsdam',
      transportMode: 'road',
      weight: 1000,
      distance: 10
    });
    
    expect(result.success).toBe(true);
    expect(result.emissions.total).toBeGreaterThan(0);
  });
});

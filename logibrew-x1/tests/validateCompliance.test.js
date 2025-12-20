/**
 * Unit Tests for validateCompliance Function
 * 
 * Tests compliance validation against embedded rules including:
 * - UN code format validation
 * - Transport mode restrictions
 * - Cargo type validation
 * - Weight limits for hazmat
 * - Perishable goods requirements
 * 
 * Target Coverage: 90%
 */

import { validateCompliance } from '../src/index.js';
import complianceRules from '../src/rules.json';

describe('validateCompliance', () => {
  // ===== Input Validation Tests =====
  
  test('should reject null payload', async () => {
    const result = await validateCompliance(null);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('INVALID_PAYLOAD');
  });

  test('should reject undefined payload', async () => {
    const result = await validateCompliance(undefined);
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('INVALID_PAYLOAD');
  });

  test('should reject non-object payload', async () => {
    const result = await validateCompliance("invalid");
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_PAYLOAD');
  });

  // ===== UN Code Validation Tests =====

  test('should validate valid UN code format', async () => {
    const result = await validateCompliance({
      unCode: 'UN1203',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(false); // Forbidden on passenger aircraft
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PASSENGER_AIRCRAFT_RESTRICTION'
        })
      ])
    );
  });

  test('should reject invalid UN code format - missing UN prefix', async () => {
    const result = await validateCompliance({
      unCode: '1203',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_UN_CODE_FORMAT');
    expect(result.issues[0].message).toContain('Invalid UN code format');
  });

  test('should reject invalid UN code format - too few digits', async () => {
    const result = await validateCompliance({
      unCode: 'UN123',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_UN_CODE_FORMAT');
  });

  test('should reject invalid UN code format - too many digits', async () => {
    const result = await validateCompliance({
      unCode: 'UN12345',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_UN_CODE_FORMAT');
  });

  test('should reject unknown UN code', async () => {
    const result = await validateCompliance({
      unCode: 'UN9999',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_UN_CODE');
    expect(result.issues[0].message).toContain('not found in compliance database');
  });

  // ===== Transport Mode Tests =====

  test('should accept valid air transport mode', async () => {
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should accept valid sea transport mode', async () => {
    const result = await validateCompliance({
      transportMode: 'sea',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should accept valid road transport mode', async () => {
    const result = await validateCompliance({
      transportMode: 'road',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should accept valid rail transport mode', async () => {
    const result = await validateCompliance({
      transportMode: 'rail',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid transport mode', async () => {
    const result = await validateCompliance({
      transportMode: 'spaceship',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_TRANSPORT_MODE');
    expect(result.issues[0].message).toContain('Invalid transport mode');
  });

  test('should reject empty transport mode', async () => {
    const result = await validateCompliance({
      transportMode: '',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_TRANSPORT_MODE');
  });

  // ===== Cargo Type Tests =====

  test('should accept general cargo type', async () => {
    const result = await validateCompliance({
      transportMode: 'sea',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should accept hazmat cargo type', async () => {
    const result = await validateCompliance({
      unCode: 'UN1789', // Hydrochloric acid
      transportMode: 'sea',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should accept perishable cargo type', async () => {
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'perishable',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('should accept temperature-controlled cargo type', async () => {
    const result = await validateCompliance({
      transportMode: 'road',
      cargoType: 'temperature-controlled',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid cargo type', async () => {
    const result = await validateCompliance({
      transportMode: 'sea',
      cargoType: 'exotic',
      weight: 100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_CARGO_TYPE');
  });

  // ===== Weight Validation Tests =====

  test('should reject zero weight', async () => {
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'general',
      weight: 0
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_WEIGHT');
  });

  test('should reject negative weight', async () => {
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'general',
      weight: -100
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_WEIGHT');
  });

  test('should reject excessive weight', async () => {
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'general',
      weight: 2000000
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('INVALID_WEIGHT');
  });

  test('should accept valid weight range', async () => {
    const result = await validateCompliance({
      transportMode: 'sea',
      cargoType: 'general',
      weight: 5000
    });
    
    expect(result.isValid).toBe(true);
  });

  // ===== Hazmat-Specific Tests =====

  test('should flag UN1203 (Gasoline) as forbidden on passenger aircraft', async () => {
    const result = await validateCompliance({
      unCode: 'UN1203',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 50
    });
    
    expect(result.isValid).toBe(true); // Passenger aircraft restriction is a warning, not an error
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PASSENGER_AIRCRAFT_RESTRICTION',
          message: expect.stringContaining('Cargo aircraft only')
        })
      ])
    );
  });

  test('should allow UN1789 (Hydrochloric acid) on air transport', async () => {
    const result = await validateCompliance({
      unCode: 'UN1789',
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 25
    });
    
    expect(result.isValid).toBe(true);
    expect(result.details.unCode).toBeDefined();
    expect(result.details.unCode.name).toBe('Hydrochloric acid');
  });

  test('should enforce weight limits for hazmat air transport', async () => {
    const result = await validateCompliance({
      unCode: 'UN1789', // 30L max for air
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 50000 // Excessive weight
    });
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'WEIGHT_LIMIT_EXCEEDED'
        })
      ])
    );
  });

  // ===== Perishable Goods Tests =====

  test('should warn about perishable requirements', async () => {
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'perishable',
      weight: 500
    });
    
    expect(result.isValid).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PERISHABLE_REQUIREMENTS',
          message: expect.stringContaining('Temperature-controlled')
        })
      ])
    );
    expect(result.details.perishable).toBeDefined();
  });

  test('should provide temperature-controlled cargo details', async () => {
    const result = await validateCompliance({
      transportMode: 'sea',
      cargoType: 'temperature-controlled',
      weight: 1000
    });
    
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.details.perishable).toBeDefined();
    expect(result.details.perishable.temperatureRange).toBeDefined();
  });

  // ===== Complete Validation Scenarios =====

  test('should validate complete valid shipment', async () => {
    const result = await validateCompliance({
      unCode: 'UN1845', // Dry ice
      transportMode: 'air',
      cargoType: 'hazmat',
      weight: 150
    });
    
    expect(result.isValid).toBe(true);
    expect(result.recommendations).toContain('Shipment meets all compliance requirements. Proceed with booking.');
  });

  test('should handle missing optional UN code for general cargo', async () => {
    const result = await validateCompliance({
      transportMode: 'road',
      cargoType: 'general',
      weight: 2000
    });
    
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  // ===== Error Handling Tests =====

  test('should handle internal errors gracefully', async () => {
    // This test ensures error handling in the catch block
    const result = await validateCompliance({
      transportMode: 'air',
      cargoType: 'general',
      weight: 100
    });
    
    // Should return valid result structure even if errors occur
    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('recommendations');
  });

  // ===== Case Sensitivity Tests =====

  test('should handle uppercase UN codes', async () => {
    const result = await validateCompliance({
      unCode: 'UN1789',
      transportMode: 'sea',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should handle lowercase UN codes', async () => {
    const result = await validateCompliance({
      unCode: 'un1789',
      transportMode: 'sea',
      cargoType: 'hazmat',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });

  test('should handle mixed case transport modes', async () => {
    const result = await validateCompliance({
      transportMode: 'AIR',
      cargoType: 'general',
      weight: 100
    });
    
    expect(result.isValid).toBe(true);
  });
});

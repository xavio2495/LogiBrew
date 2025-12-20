/**
 * Unit Tests for Hash Chain Utilities
 * 
 * Tests cryptographic hash chain functionality including:
 * - Hash generation determinism
 * - Chain integrity verification
 * - Tamper detection
 * - Genesis block handling
 * - Hash linking
 * 
 * Target Coverage: 95% (security-critical)
 */

import { generateHash, verifyChain } from '../src/hashChain.js';

describe('Hash Chain Utilities', () => {
  // ===== Hash Generation Tests =====

  test('should generate deterministic hash', () => {
    const record = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const hash1 = generateHash(record);
    const hash2 = generateHash(record);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
  });

  test('should generate different hashes for different records', () => {
    const record1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const record2 = {
      timestamp: 1703174400000,
      action: 'route_change',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const hash1 = generateHash(record1);
    const hash2 = generateHash(record2);

    expect(hash1).not.toBe(hash2);
  });

  test('should generate different hashes for different timestamps', () => {
    const record1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const record2 = {
      ...record1,
      timestamp: 1703174500000
    };

    const hash1 = generateHash(record1);
    const hash2 = generateHash(record2);

    expect(hash1).not.toBe(hash2);
  });

  test('should generate different hashes for different userIds', () => {
    const record1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const record2 = {
      ...record1,
      userId: 'user456'
    };

    const hash1 = generateHash(record1);
    const hash2 = generateHash(record2);

    expect(hash1).not.toBe(hash2);
  });

  test('should generate different hashes for different decisions', () => {
    const record1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const record2 = {
      ...record1,
      decision: { status: 'rejected' }
    };

    const hash1 = generateHash(record1);
    const hash2 = generateHash(record2);

    expect(hash1).not.toBe(hash2);
  });

  test('should handle genesis block with previousHash "0"', () => {
    const genesisRecord = {
      timestamp: 1703174400000,
      action: 'initial',
      userId: 'system',
      shipmentId: 'SHIP-001',
      decision: { status: 'created' },
      previousHash: '0'
    };

    const hash = generateHash(genesisRecord);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // Valid hex
  });

  test('should handle missing previousHash as "0"', () => {
    const record = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' }
      // previousHash intentionally missing
    };

    const hash = generateHash(record);

    expect(hash).toHaveLength(64);
  });

  test('should produce valid hexadecimal hash', () => {
    const record = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const hash = generateHash(record);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  // ===== Chain Verification Tests =====

  test('should verify empty chain', () => {
    const chain = [];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(true);
  });

  test('should verify single-entry chain', () => {
    const entry = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0',
      hash: ''
    };

    entry.hash = generateHash(entry);
    const chain = [entry];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(true);
  });

  test('should verify valid two-entry chain', () => {
    const entry1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0',
      hash: ''
    };
    entry1.hash = generateHash(entry1);

    const entry2 = {
      timestamp: 1703174500000,
      action: 'route_change',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { route: 'alternate' },
      previousHash: entry1.hash,
      hash: ''
    };
    entry2.hash = generateHash(entry2);

    const chain = [entry1, entry2];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(true);
  });

  test('should verify valid multi-entry chain', () => {
    const chain = [];
    
    for (let i = 0; i < 5; i++) {
      const entry = {
        timestamp: 1703174400000 + (i * 1000),
        action: `action_${i}`,
        userId: 'user123',
        shipmentId: 'SHIP-001',
        decision: { step: i },
        previousHash: i === 0 ? '0' : chain[i - 1].hash,
        hash: ''
      };
      entry.hash = generateHash(entry);
      chain.push(entry);
    }

    const isValid = verifyChain(chain);

    expect(isValid).toBe(true);
  });

  test('should detect broken previousHash link', () => {
    const entry1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0',
      hash: ''
    };
    entry1.hash = generateHash(entry1);

    const entry2 = {
      timestamp: 1703174500000,
      action: 'route_change',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { route: 'alternate' },
      previousHash: 'invalid_hash', // Broken link
      hash: ''
    };
    entry2.hash = generateHash(entry2);

    const chain = [entry1, entry2];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(false);
  });

  test('should detect tampered entry content', () => {
    const entry1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0',
      hash: ''
    };
    entry1.hash = generateHash(entry1);

    const entry2 = {
      timestamp: 1703174500000,
      action: 'route_change',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { route: 'alternate' },
      previousHash: entry1.hash,
      hash: ''
    };
    entry2.hash = generateHash(entry2);

    // Tamper with entry after hash generation
    entry2.decision.route = 'tampered';

    const chain = [entry1, entry2];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(false);
  });

  test('should detect tampered hash', () => {
    const entry1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0',
      hash: ''
    };
    entry1.hash = generateHash(entry1);

    const entry2 = {
      timestamp: 1703174500000,
      action: 'route_change',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { route: 'alternate' },
      previousHash: entry1.hash,
      hash: ''
    };
    entry2.hash = generateHash(entry2);
    
    // Tamper with hash directly
    entry2.hash = entry2.hash.replace('a', 'b');

    const chain = [entry1, entry2];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(false);
  });

  test('should detect missing previousHash in chain', () => {
    const entry1 = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0',
      hash: ''
    };
    entry1.hash = generateHash(entry1);

    const entry2 = {
      timestamp: 1703174500000,
      action: 'route_change',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { route: 'alternate' },
      previousHash: '', // Empty previousHash
      hash: ''
    };
    entry2.hash = generateHash(entry2);

    const chain = [entry1, entry2];
    const isValid = verifyChain(chain);

    expect(isValid).toBe(false);
  });

  // ===== Hash Chain Properties Tests =====

  test('should maintain chain immutability property', () => {
    // Once a chain is created, any modification should be detectable
    const chain = [];
    
    for (let i = 0; i < 3; i++) {
      const entry = {
        timestamp: 1703174400000 + (i * 1000),
        action: `action_${i}`,
        userId: 'user123',
        shipmentId: 'SHIP-001',
        decision: { step: i },
        previousHash: i === 0 ? '0' : chain[i - 1].hash,
        hash: ''
      };
      entry.hash = generateHash(entry);
      chain.push(entry);
    }

    // Verify original chain is valid
    expect(verifyChain(chain)).toBe(true);

    // Modify middle entry
    chain[1].decision.step = 999;

    // Chain should now be invalid
    expect(verifyChain(chain)).toBe(false);
  });

  test('should handle complex decision objects', () => {
    const record = {
      timestamp: 1703174400000,
      action: 'compliance_check',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: {
        status: 'approved',
        unCode: 'UN1203',
        validations: ['weight', 'mode', 'timeline'],
        metadata: {
          reviewer: 'system',
          confidence: 0.95
        }
      },
      previousHash: '0'
    };

    const hash = generateHash(record);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('should handle special characters in fields', () => {
    const record = {
      timestamp: 1703174400000,
      action: 'compliance_check with "quotes" & symbols',
      userId: 'user@example.com',
      shipmentId: 'SHIP-001/2025',
      decision: { status: 'approved', notes: 'Special: <>&"' },
      previousHash: '0'
    };

    const hash = generateHash(record);

    expect(hash).toHaveLength(64);
  });

  // ===== Performance and Edge Cases =====

  test('should handle very long chain efficiently', () => {
    const chain = [];
    const startTime = Date.now();
    
    // Create 100-entry chain
    for (let i = 0; i < 100; i++) {
      const entry = {
        timestamp: 1703174400000 + (i * 1000),
        action: `action_${i}`,
        userId: 'user123',
        shipmentId: 'SHIP-001',
        decision: { step: i },
        previousHash: i === 0 ? '0' : chain[i - 1].hash,
        hash: ''
      };
      entry.hash = generateHash(entry);
      chain.push(entry);
    }

    const isValid = verifyChain(chain);
    const duration = Date.now() - startTime;

    expect(isValid).toBe(true);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  test('should handle identical timestamps with different actions', () => {
    const timestamp = 1703174400000;
    
    const record1 = {
      timestamp,
      action: 'action_A',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const record2 = {
      timestamp,
      action: 'action_B',
      userId: 'user123',
      shipmentId: 'SHIP-001',
      decision: { status: 'approved' },
      previousHash: '0'
    };

    const hash1 = generateHash(record1);
    const hash2 = generateHash(record2);

    expect(hash1).not.toBe(hash2);
  });
});

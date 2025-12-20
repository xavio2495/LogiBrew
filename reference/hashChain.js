/**
 * Hash Chain Utilities for LogiBrew
 * 
 * Provides tamper-evident logging for compliance decisions using SHA-256 hash chains.
 * Each log entry is cryptographically linked to the previous entry, creating an
 * immutable audit trail for regulatory compliance and dispute resolution.
 * 
 * @module hashChain
 */

import crypto from 'crypto';
import { storage } from '@forge/api';

/**
 * Generate SHA-256 hash for a decision record
 * 
 * Creates a deterministic hash by serializing the record fields in a consistent order.
 * The hash includes the previous hash, creating a chain where each entry validates
 * all prior entries.
 * 
 * @param {Object} record - Decision data to hash
 * @param {number} record.timestamp - Unix timestamp in milliseconds
 * @param {string} record.action - Action type (e.g., 'route_change', 'compliance_check')
 * @param {string} record.userId - Atlassian account ID of the user who made the decision
 * @param {string} record.shipmentId - Unique shipment identifier
 * @param {Object} record.decision - Decision details (route, cargo, compliance status, etc.)
 * @param {string} [record.previousHash='0'] - Hash of the previous entry ('0' for genesis block)
 * @returns {string} 64-character hex-encoded SHA-256 hash
 * 
 * @example
 * const hash = generateHash({
 *   timestamp: Date.now(),
 *   action: 'compliance_check',
 *   userId: 'account:557058:abc123',
 *   shipmentId: 'SHIP-2025-001',
 *   decision: { status: 'approved', unCode: 'UN1234' },
 *   previousHash: '0'
 * });
 * // Returns: 'a7f3c92d8e4b1f6c9e2a5d8b3c1e4f7a...'
 */
export function generateHash(record) {
  // Serialize record fields in consistent order for deterministic hashing
  const data = JSON.stringify({
    timestamp: record.timestamp,
    action: record.action,
    userId: record.userId,
    shipmentId: record.shipmentId,
    decision: record.decision,
    previousHash: record.previousHash || '0' // Genesis block starts with '0'
  });
  
  // Generate SHA-256 hash and return as hexadecimal string
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Verify integrity of a decision log chain
 * 
 * Validates that:
 * 1. Each entry correctly references the previous entry's hash
 * 2. Each entry's hash matches its content (no tampering)
 * 
 * @param {Array<Object>} logChain - Array of log entries with hashes
 * @param {string} logChain[].hash - This entry's hash
 * @param {string} logChain[].previousHash - Previous entry's hash
 * @returns {boolean} True if chain is valid, false if broken or tampered
 * 
 * @example
 * const chain = [
 *   { hash: 'abc123...', previousHash: '0', ... },
 *   { hash: 'def456...', previousHash: 'abc123...', ... }
 * ];
 * const isValid = verifyChain(chain); // true
 */
export function verifyChain(logChain) {
  // Skip verification for empty or single-entry chains
  if (logChain.length <= 1) {
    return true;
  }
  
  // Verify each entry links correctly to the previous one
  for (let i = 1; i < logChain.length; i++) {
    const currentEntry = logChain[i];
    const previousHash = logChain[i - 1].hash;
    
    // Check 1: Verify previous hash link
    if (currentEntry.previousHash !== previousHash) {
      console.error(`Chain broken at index ${i}: previousHash mismatch`);
      console.error(`Expected: ${previousHash}, Got: ${currentEntry.previousHash}`);
      return false;
    }
    
    // Check 2: Recalculate hash to verify integrity (detect tampering)
    const recalculatedHash = generateHash(currentEntry);
    if (recalculatedHash !== currentEntry.hash) {
      console.error(`Tampered entry detected at index ${i}`);
      console.error(`Expected hash: ${currentEntry.hash}, Calculated: ${recalculatedHash}`);
      return false;
    }
  }
  
  console.log(`Chain verified successfully (${logChain.length} entries)`);
  return true;
}

/**
 * Store hash chain root in Confluence content property
 * 
 * Persists the root hash of a completed chain to a Confluence page for
 * long-term audit trail storage. Uses Confluence Content Properties API
 * for CQL-searchable metadata.
 * 
 * @param {string} pageId - Confluence page ID where the root will be stored
 * @param {string} hashRoot - Root hash of the chain (last entry's hash)
 * @param {Object} metadata - Additional context for the hash root
 * @param {string} metadata.shipmentId - Related shipment identifier
 * @param {number} metadata.chainLength - Number of entries in the chain
 * @returns {Promise<void>}
 * 
 * @example
 * await storeHashRoot('123456', 'a7f3c92d...', {
 *   shipmentId: 'SHIP-2025-001',
 *   chainLength: 5
 * });
 */
export async function storeHashRoot(pageId, hashRoot, metadata = {}) {
  const propertyKey = 'logibrew-hash-root';
  const propertyValue = {
    root: hashRoot,
    timestamp: new Date().toISOString(),
    version: '1.0',
    shipmentId: metadata.shipmentId,
    chainLength: metadata.chainLength,
    verifiedAt: Date.now()
  };
  
  try {
    // Use Confluence Content Properties API via REST
    // Note: Must use .asUser() or .asApp() depending on authorization context
    await api.asUser().requestConfluence(
      `/rest/api/content/${pageId}/property/${propertyKey}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          key: propertyKey,
          value: propertyValue 
        })
      }
    );
    
    console.log(`Hash root stored to Confluence page ${pageId}`);
  } catch (error) {
    console.error(`Failed to store hash root: ${error.message}`);
    throw error;
  }
}

/**
 * Log a compliance decision with hash verification
 * 
 * Complete workflow for creating a tamper-evident log entry:
 * 1. Retrieves the previous entry's hash from Forge Storage
 * 2. Creates new log entry with decision details
 * 3. Generates hash linking to previous entry
 * 4. Stores as latest entry and appends to chain
 * 
 * @param {Object} decision - Decision details to log
 * @param {string} decision.action - Action type (e.g., 'route_change', 'compliance_check')
 * @param {string} decision.userId - Atlassian account ID of decision maker
 * @param {string} decision.shipmentId - Unique shipment identifier
 * @param {Object} decision.outcome - Decision outcome details
 * @returns {Promise<Object>} Log entry with generated hash
 * 
 * @example
 * const logEntry = await logComplianceDecision({
 *   action: 'compliance_check',
 *   userId: 'account:557058:abc123',
 *   shipmentId: 'SHIP-2025-001',
 *   outcome: {
 *     status: 'approved',
 *     unCode: 'UN1234',
 *     validatedBy: 'IATA',
 *     notes: 'Hazmat classification verified'
 *   }
 * });
 * // Returns: { hash: '...', previousHash: '...', timestamp: ..., ... }
 */
export async function logComplianceDecision(decision) {
  try {
    // Retrieve previous hash from Forge Storage (scoped to app)
    const previousEntry = await storage.get('latest-log-entry');
    const previousHash = previousEntry?.hash || '0'; // Genesis block if first entry
    
    // Create new log entry with timestamp and previous hash link
    const logEntry = {
      timestamp: Date.now(),
      action: decision.action,
      userId: decision.userId,
      shipmentId: decision.shipmentId,
      decision: decision.outcome,
      previousHash: previousHash
    };
    
    // Generate cryptographic hash for this entry
    logEntry.hash = generateHash(logEntry);
    
    // Store as latest entry (overwrites previous "latest")
    await storage.set('latest-log-entry', logEntry);
    
    // Append to persistent chain (use entity properties for long-term storage)
    const chainKey = `shipment-${decision.shipmentId}-chain`;
    const existingChain = await storage.get(chainKey) || [];
    existingChain.push(logEntry);
    await storage.set(chainKey, existingChain);
    
    console.log(`Logged decision with hash: ${logEntry.hash.substring(0, 16)}...`);
    console.log(`Chain length for ${decision.shipmentId}: ${existingChain.length}`);
    
    return logEntry;
  } catch (error) {
    console.error(`Failed to log compliance decision: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieve and verify complete chain for a shipment
 * 
 * Fetches the full chain from Forge Storage and validates integrity.
 * Useful for audit reports or compliance verification.
 * 
 * @param {string} shipmentId - Unique shipment identifier
 * @returns {Promise<Object>} Verification result with chain data
 * @returns {boolean} .isValid - Whether chain is valid
 * @returns {Array<Object>} .chain - Full chain of log entries
 * @returns {number} .length - Number of entries in chain
 * @returns {string} .rootHash - Hash of the latest entry
 * 
 * @example
 * const result = await getVerifiedChain('SHIP-2025-001');
 * if (result.isValid) {
 *   console.log(`Chain verified: ${result.length} entries`);
 *   console.log(`Root hash: ${result.rootHash}`);
 * }
 */
export async function getVerifiedChain(shipmentId) {
  const chainKey = `shipment-${shipmentId}-chain`;
  const chain = await storage.get(chainKey) || [];
  
  if (chain.length === 0) {
    return {
      isValid: true,
      chain: [],
      length: 0,
      rootHash: null
    };
  }
  
  const isValid = verifyChain(chain);
  const rootHash = chain[chain.length - 1]?.hash;
  
  return {
    isValid,
    chain,
    length: chain.length,
    rootHash
  };
}

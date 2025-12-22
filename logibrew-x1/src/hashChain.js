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
 */
function generateHash(record) {
  const data = JSON.stringify({
    timestamp: record.timestamp,
    action: record.action,
    userId: record.userId,
    shipmentId: record.shipmentId,
    decision: record.decision,
    previousHash: record.previousHash || '0'
  });
  
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Verify integrity of a decision log chain
 */
function verifyChain(logChain) {
  if (logChain.length <= 1) {
    return true;
  }
  
  for (let i = 1; i < logChain.length; i++) {
    const currentEntry = logChain[i];
    const previousHash = logChain[i - 1].hash;
    
    if (currentEntry.previousHash !== previousHash) {
      console.error(`Chain broken at index ${i}: previousHash mismatch`);
      return false;
    }
    
    const recalculatedHash = generateHash(currentEntry);
    if (recalculatedHash !== currentEntry.hash) {
      console.error(`Tampered entry detected at index ${i}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Log a compliance decision with hash verification
 */
async function logComplianceDecision(decision) {
  try {
    const previousEntry = await storage.get('latest-log-entry');
    const previousHash = previousEntry?.hash || '0';
    
    const logEntry = {
      timestamp: Date.now(),
      action: decision.action,
      userId: decision.userId,
      shipmentId: decision.shipmentId,
      decision: decision.outcome,
      previousHash: previousHash
    };
    
    logEntry.hash = generateHash(logEntry);
    
    await storage.set('latest-log-entry', logEntry);
    
    const chainKey = `shipment-${decision.shipmentId}-chain`;
    const existingChain = await storage.get(chainKey) || [];
    existingChain.push(logEntry);
    await storage.set(chainKey, existingChain);
    
    console.log(`Logged decision with hash: ${logEntry.hash.substring(0, 16)}...`);
    
    return logEntry;
  } catch (error) {
    console.error(`Failed to log compliance decision: ${error.message}`);
    throw error;
  }
}

export {
  generateHash,
  verifyChain,
  logComplianceDecision
};

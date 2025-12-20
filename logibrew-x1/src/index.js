/**
 * LogiBrew Backend Functions
 * 
 * Implements compliance validation, hash-chained logging, and emission calculations
 * for logistics disruption management.
 */

import complianceRules from './rules.json';
import { generateHash, logComplianceDecision as logToHashChain } from '../reference/hashChain.js';
import { storage } from '@forge/api';

/**
 * Validate Compliance Action Handler
 * 
 * Validates shipment details against embedded compliance rules from rules.json.
 * Checks UN codes, transport mode restrictions, multimodal transitions, and perishable limits.
 * 
 * @param {Object} payload - Shipment validation request
 * @param {string} payload.unCode - UN hazardous material code (optional)
 * @param {string} payload.transportMode - Transport mode (air/sea/road/rail)
 * @param {string} payload.cargoType - Cargo category (hazmat/perishable/general/temperature-controlled)
 * @param {number} payload.weight - Cargo weight in kg
 * @returns {Object} Validation result with issues and recommendations
 */
export async function validateCompliance(payload) {
  console.log('Starting compliance validation:', payload);
  
  const { unCode, transportMode, cargoType, weight } = payload;
  const validationResult = {
    isValid: true,
    issues: [],
    warnings: [],
    recommendations: [],
    details: {}
  };

  try {
    // Validate UN code for hazmat cargo
    if (unCode && cargoType === 'hazmat') {
      const unCodeData = complianceRules.complianceRules.unCodes.rules.find(
        rule => rule.code.toLowerCase() === unCode.toLowerCase()
      );

      if (!unCodeData) {
        validationResult.isValid = false;
        validationResult.issues.push({
          type: 'INVALID_UN_CODE',
          severity: 'error',
          message: `UN code ${unCode} not found in compliance database. Please verify the code.`,
          recommendation: 'Check IATA DGR or IMO IMDG Code for correct UN classification.'
        });
      } else {
        // Check transport mode restrictions
        const modeRestriction = unCodeData.restrictions[transportMode];
        
        if (!modeRestriction || !modeRestriction.allowed) {
          validationResult.isValid = false;
          validationResult.issues.push({
            type: 'TRANSPORT_MODE_FORBIDDEN',
            severity: 'error',
            message: `${unCodeData.name} (${unCode}) is forbidden for ${transportMode} transport.`,
            recommendation: `Consider alternate transport modes: ${Object.keys(unCodeData.restrictions).filter(m => unCodeData.restrictions[m].allowed).join(', ')}`
          });
        } else {
          // Check weight limits
          const maxQty = modeRestriction.maxQuantity;
          if (maxQty && maxQty !== 'unlimited') {
            const limit = parseInt(maxQty.replace(/[^0-9]/g, ''));
            if (weight > limit) {
              validationResult.isValid = false;
              validationResult.issues.push({
                type: 'WEIGHT_LIMIT_EXCEEDED',
                severity: 'error',
                message: `Cargo weight ${weight}kg exceeds ${transportMode} limit of ${maxQty}.`,
                recommendation: 'Split shipment or use different transport mode.'
              });
            }
          }

          // Check passenger aircraft restrictions for air transport
          if (transportMode === 'air' && !modeRestriction.passengerAircraft) {
            validationResult.warnings.push({
              type: 'PASSENGER_AIRCRAFT_RESTRICTION',
              severity: 'warning',
              message: `${unCodeData.name} forbidden on passenger aircraft. Cargo aircraft only.`,
              recommendation: 'Ensure booking specifies cargo aircraft routing.'
            });
          }

          // Add compliance details
          validationResult.details.unCode = {
            code: unCode,
            name: unCodeData.name,
            class: unCodeData.class,
            packingGroup: unCodeData.packingGroup,
            restrictions: modeRestriction,
            specialProvisions: modeRestriction.specialProvisions || []
          };
        }
      }
    }

    // Validate perishable goods
    if (cargoType === 'perishable' || cargoType === 'temperature-controlled') {
      const perishableRules = complianceRules.complianceRules.perishableGoods.rules;
      const category = cargoType === 'perishable' ? 'refrigerated' : 'temperature_controlled';
      const perishableData = perishableRules.find(r => r.category === category);

      if (perishableData) {
        validationResult.warnings.push({
          type: 'PERISHABLE_REQUIREMENTS',
          severity: 'warning',
          message: `Temperature-controlled cargo requires ${perishableData.temperatureRange.min}°C to ${perishableData.temperatureRange.max}°C.`,
          recommendation: `Max transit time for ${transportMode}: ${perishableData.maxTransitDays[transportMode]} days. ${perishableData.notes}`
        });

        validationResult.details.perishable = {
          category: perishableData.category,
          temperatureRange: perishableData.temperatureRange,
          maxTransitDays: perishableData.maxTransitDays[transportMode],
          notes: perishableData.notes
        };
      }
    }

    // General route validation
    const routeRules = complianceRules.complianceRules.routeValidation.rules;
    const transportModeCheck = routeRules.find(r => r.check === 'transport_mode_required');
    if (!transportMode) {
      validationResult.isValid = false;
      validationResult.issues.push({
        type: 'MISSING_TRANSPORT_MODE',
        severity: 'error',
        message: transportModeCheck.message,
        recommendation: 'Specify transport mode: air, sea, road, or rail.'
      });
    }

    // Summary recommendations
    if (validationResult.isValid && validationResult.warnings.length === 0) {
      validationResult.recommendations.push('Shipment meets all compliance requirements. Proceed with booking.');
    } else if (validationResult.isValid && validationResult.warnings.length > 0) {
      validationResult.recommendations.push('Shipment is compliant but has warnings. Review special handling requirements.');
    }

    console.log('Compliance validation completed:', validationResult);
    return validationResult;

  } catch (error) {
    console.error('Compliance validation error:', error);
    return {
      isValid: false,
      issues: [{
        type: 'VALIDATION_ERROR',
        severity: 'error',
        message: `Internal validation error: ${error.message}`,
        recommendation: 'Contact support if issue persists.'
      }],
      warnings: [],
      recommendations: [],
      details: {}
    };
  }
}

/**
 * Log Compliance Decision Action Handler
 * 
 * Creates a verifiable hash-chained log entry for compliance decisions.
 * Uses the hash chain utilities from reference/hashChain.js to generate tamper-evident audit trails.
 * 
 * @param {Object} payload - Decision log request
 * @param {string} payload.action - Decision type (route_change, compliance_check, etc.)
 * @param {string} payload.shipmentId - Unique shipment identifier
 * @param {string} payload.outcome - Decision outcome details
 * @param {string} payload.notes - Optional context/justification
 * @returns {Object} Log entry with hash and verification details
 */
export async function logComplianceDecision(payload) {
  console.log('Logging compliance decision:', payload);

  try {
    const { action, shipmentId, outcome, notes } = payload;

    // Get user context from the request (if available)
    // In production, this would come from Forge context API
    const userId = 'system'; // Placeholder - replace with actual user ID from context

    // Create decision outcome object
    const decisionOutcome = {
      status: outcome,
      notes: notes || '',
      timestamp: new Date().toISOString()
    };

    // Use hash chain utility to create verifiable log entry
    const logEntry = await logToHashChain({
      action,
      userId,
      shipmentId,
      outcome: decisionOutcome
    });

    console.log(`Decision logged with hash: ${logEntry.hash.substring(0, 16)}...`);

    return {
      success: true,
      logEntry: {
        hash: logEntry.hash,
        previousHash: logEntry.previousHash,
        timestamp: logEntry.timestamp,
        action: logEntry.action,
        shipmentId: logEntry.shipmentId,
        outcome: logEntry.decision
      },
      message: 'Compliance decision logged successfully. Hash can be used for audit verification.',
      auditNote: 'This log entry is cryptographically linked to previous entries. Any tampering will break the chain.'
    };

  } catch (error) {
    console.error('Compliance logging error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to log compliance decision. Please try again.',
      recommendation: 'Ensure shipment ID is valid and Forge storage is accessible.'
    };
  }
}

/**
 * Calculate Emissions Action Handler
 * 
 * Calculates carbon emissions for shipment routes based on distance, weight, and transport mode.
 * Checks against EU ETS thresholds and recommends carbon offsets if needed.
 * 
 * @param {Object} payload - Emission calculation request
 * @param {string} payload.origin - Origin location
 * @param {string} payload.destination - Destination location
 * @param {string} payload.transportMode - Transport mode (air/sea/road/rail)
 * @param {number} payload.weight - Cargo weight in kg
 * @param {number} payload.distance - Optional route distance in km
 * @returns {Object} Emission calculation result with compliance status
 */
export async function calculateEmissions(payload) {
  console.log('Calculating emissions:', payload);

  try {
    const { origin, destination, transportMode, weight, distance } = payload;

    // Get emission factor from rules
    const emissionFactors = complianceRules.complianceRules.emissionThresholds.emissionFactors;
    const factor = emissionFactors[transportMode];

    if (!factor) {
      return {
        success: false,
        error: `Invalid transport mode: ${transportMode}`,
        recommendation: 'Use: air, sea, road, or rail'
      };
    }

    // Calculate distance (simplified - in production, use geocoding API)
    // For now, use provided distance or estimate based on origin/destination hash
    let routeDistance = distance;
    if (!routeDistance) {
      // Simple estimation based on location name lengths (mock)
      const seed = (origin + destination).length;
      routeDistance = 1000 + (seed * 100); // Mock: 1000-5000km range
      console.log(`Estimated distance: ${routeDistance}km (use actual geocoding in production)`);
    }

    // Calculate emissions: (weight in tons) * distance * emission factor
    const tonKm = (weight / 1000) * routeDistance;
    const totalEmissions = tonKm * factor;

    // Check against EU ETS threshold
    const euEtsRule = complianceRules.complianceRules.emissionThresholds.rules.find(
      r => r.regulation === 'EU_ETS'
    );
    const euEtsThreshold = euEtsRule.threshold;
    const exceedsEuEts = totalEmissions > euEtsThreshold;

    // Check against offset recommendation threshold
    const offsetRule = complianceRules.complianceRules.emissionThresholds.rules.find(
      r => r.regulation === 'GENERAL_CARBON_OFFSET'
    );
    const offsetThreshold = offsetRule.threshold;
    const offsetRecommended = totalEmissions > offsetThreshold;

    // Build result
    const result = {
      success: true,
      emissions: {
        total: Math.round(totalEmissions * 100) / 100,
        unit: 'kg_co2',
        breakdown: {
          weight: weight,
          weightUnit: 'kg',
          distance: routeDistance,
          distanceUnit: 'km',
          transportMode: transportMode,
          emissionFactor: factor,
          emissionFactorUnit: 'kg_co2_per_ton_km'
        }
      },
      compliance: {
        euEts: {
          threshold: euEtsThreshold,
          exceeded: exceedsEuEts,
          status: exceedsEuEts ? 'reporting_required' : 'compliant',
          notes: exceedsEuEts ? euEtsRule.notes : 'Below EU ETS threshold - no reporting required'
        },
        carbonOffset: {
          recommended: offsetRecommended,
          threshold: offsetThreshold,
          notes: offsetRecommended ? offsetRule.notes : 'Carbon offset optional'
        }
      },
      recommendations: []
    };

    // Add recommendations
    if (exceedsEuEts) {
      result.recommendations.push('EU ETS compliance reporting required for this shipment.');
    }
    if (offsetRecommended) {
      result.recommendations.push(`Consider purchasing carbon offsets (${Math.round(totalEmissions)}kg CO2).`);
    }
    if (transportMode === 'air' && totalEmissions > 100) {
      result.recommendations.push('Consider sea or rail transport to reduce emissions by up to 98%.');
    }

    console.log('Emission calculation completed:', result);
    return result;

  } catch (error) {
    console.error('Emission calculation error:', error);
    return {
      success: false,
      error: error.message,
      recommendation: 'Verify input parameters (origin, destination, transport mode, weight).'
    };
  }
}

/**
 * Shipment Panel Resolver
 * 
 * Backend resolver for the Jira issue panel. Validates shipment data and returns
 * both compliance validation and emission calculation results.
 * 
 * @param {Object} payload - Shipment data from UI form
 * @param {string} payload.origin - Origin location
 * @param {string} payload.destination - Destination location
 * @param {string} payload.cargoType - Cargo type
 * @param {number} payload.weight - Cargo weight in kg
 * @param {string} payload.unCode - Optional UN code for hazmat
 * @param {string} payload.transportMode - Transport mode
 * @returns {Object} Combined validation and emission results
 */
export async function shipmentPanelResolver(payload) {
  console.log('Shipment panel resolver invoked:', payload);

  try {
    // Run compliance validation
    const validation = await validateCompliance({
      unCode: payload.unCode,
      transportMode: payload.transportMode,
      cargoType: payload.cargoType,
      weight: payload.weight
    });

    // Run emission calculation
    const emissions = await calculateEmissions({
      origin: payload.origin,
      destination: payload.destination,
      transportMode: payload.transportMode,
      weight: payload.weight
    });

    return {
      validation,
      emissions
    };

  } catch (error) {
    console.error('Shipment panel resolver error:', error);
    return {
      validation: {
        isValid: false,
        issues: [{
          type: 'RESOLVER_ERROR',
          severity: 'error',
          message: `Failed to process shipment data: ${error.message}`,
          recommendation: 'Contact support if issue persists.'
        }],
        warnings: [],
        recommendations: []
      },
      emissions: {
        success: false,
        error: error.message
      }
    };
  }
}

/**
 * Workflow Validator Handler
 * 
 * Validates shipment compliance before allowing workflow transitions.
 * Checks UN codes, emission thresholds, and perishable requirements.
 * 
 * @param {Object} args - Workflow transition data
 * @param {Object} args.issue - Jira issue being transitioned
 * @param {Object} args.transition - Transition details (from/to statuses)
 * @param {Object} args.configuration - Validator configuration (if any)
 * @returns {Object} Validation result with errorMessage if validation fails
 */
export async function workflowValidator(args) {
  console.log('Workflow validator invoked:', args);

  try {
    const { issue, transition } = args;
    
    // Extract shipment data from custom fields (assuming they exist)
    // In production, these field IDs would be configured or discovered dynamically
    const issueFields = issue.fields || {};
    
    // Check if this issue has shipment data to validate
    // Look for our custom fields or specific issue types
    const hasShipmentData = issueFields.summary?.toLowerCase().includes('shipment') || 
                           issueFields.description?.toLowerCase().includes('shipment');
    
    if (!hasShipmentData) {
      // Skip validation for non-shipment issues
      return {
        result: true
      };
    }

    // For demo purposes, validate based on issue description or labels
    // In production, this would use custom field values
    const description = issueFields.description || '';
    const labels = issueFields.labels || [];
    
    // Check for hazmat labels
    const hasHazmat = labels.some(label => label.toLowerCase().includes('hazmat'));
    
    if (hasHazmat) {
      // Check if UN code is specified in description or custom fields
      const unCodeMatch = description.match(/UN\d{4}/i);
      
      if (!unCodeMatch) {
        return {
          result: false,
          errorMessage: 'Hazmat shipments require a valid UN code before transition. Please add UN code to the description or custom fields.'
        };
      }
      
      // Validate UN code exists in rules
      const unCode = unCodeMatch[0].toUpperCase();
      const unCodeData = complianceRules.complianceRules.unCodes.rules.find(
        rule => rule.code === unCode
      );
      
      if (!unCodeData) {
        return {
          result: false,
          errorMessage: `UN code ${unCode} not found in compliance database. Please verify the code before proceeding.`
        };
      }
    }

    // Check for high-emission shipments
    const hasHighEmissions = labels.some(label => label.toLowerCase().includes('high-emissions'));
    
    if (hasHighEmissions && transition.to.name === 'Done') {
      return {
        result: false,
        errorMessage: 'High-emission shipments require EU ETS compliance documentation before completion. Please attach compliance report.'
      };
    }

    // All checks passed
    console.log('Workflow validation passed for issue:', issue.key);
    return {
      result: true
    };

  } catch (error) {
    console.error('Workflow validator error:', error);
    // Allow transition to proceed on validation errors (fail-open for safety)
    // In production, you might want fail-closed behavior
    return {
      result: true
    };
  }
}

/**
 * Workflow Post Function Handler
 * 
 * Executes after workflow transitions to generate hash-verified logs
 * and sync decision records to Confluence.
 * 
 * @param {Object} event - Post function event data
 * @param {Object} event.issue - Jira issue that transitioned
 * @param {Object} event.transition - Transition details
 * @param {Object} event.changelog - Field changes during transition
 * @returns {Promise<void>}
 */
export async function workflowPostFunction(event) {
  console.log('Workflow post function invoked:', event);

  try {
    const { issue, transition, changelog } = event;
    
    // Check if this is a shipment-related issue
    const issueFields = issue.fields || {};
    const isShipmentIssue = issueFields.summary?.toLowerCase().includes('shipment') || 
                           issueFields.description?.toLowerCase().includes('shipment');
    
    if (!isShipmentIssue) {
      console.log('Skipping post function for non-shipment issue:', issue.key);
      return;
    }

    // Create decision log entry
    const decisionAction = `transition_${transition.transitionName.toLowerCase().replace(/\s+/g, '_')}`;
    const outcome = {
      fromStatus: transition.from_status,
      toStatus: transition.to_status,
      transitionName: transition.transitionName,
      timestamp: new Date().toISOString(),
      changedFields: changelog?.items?.map(item => item.field) || [],
      issueKey: issue.key,
      issueSummary: issueFields.summary
    };

    // Log decision using hash chain
    const logEntry = await logToHashChain({
      action: decisionAction,
      userId: event.user?.accountId || 'system',
      shipmentId: issue.key,
      outcome: outcome
    });

    console.log(`Post function: Decision logged for ${issue.key} with hash ${logEntry.hash.substring(0, 16)}...`);

    // TODO Phase 2: Sync log to Confluence
    // This would create/update a Confluence page with the decision log
    // For now, just store in Forge Storage
    await storage.set(`transition-log-${issue.key}-${Date.now()}`, {
      issue: issue.key,
      logEntry: logEntry,
      transition: transition
    });

    console.log('Post function completed successfully');

  } catch (error) {
    console.error('Workflow post function error:', error);
    // Don't throw error - post functions should not block transitions
  }
}

/**
 * Issue Created Trigger Handler
 * 
 * Invoked when new issues are created. Performs initial compliance checks
 * for shipment-related issues.
 * 
 * @param {Object} event - Issue created event
 * @param {Object} event.issue - Created issue data
 * @returns {Promise<void>}
 */
export async function issueCreatedHandler(event) {
  console.log('Issue created trigger:', event);

  try {
    const issue = event.issue;
    const issueFields = issue.fields || {};
    
    // Check if this is a shipment issue
    const isShipmentIssue = issueFields.summary?.toLowerCase().includes('shipment') ||
                           issueFields.description?.toLowerCase().includes('shipment') ||
                           issueFields.labels?.some(label => label.toLowerCase().includes('logistics'));
    
    if (!isShipmentIssue) {
      console.log('Skipping AI analysis for non-shipment issue');
      return;
    }

    console.log(`AI analysis triggered for new shipment issue: ${issue.key}`);
    
    // Log creation event
    await logToHashChain({
      action: 'issue_created',
      userId: event.user?.accountId || 'system',
      shipmentId: issue.key,
      outcome: {
        summary: issueFields.summary,
        description: issueFields.description,
        timestamp: new Date().toISOString()
      }
    });

    // TODO: Invoke Rovo agent for initial analysis
    // This would be implemented in Phase 3 with deeper integration

  } catch (error) {
    console.error('Issue created handler error:', error);
  }
}

/**
 * Issue Updated Trigger Handler
 * 
 * Invoked when issues are updated. Re-validates compliance if shipment
 * details change.
 * 
 * @param {Object} event - Issue updated event  
 * @param {Object} event.issue - Updated issue data
 * @param {Object} event.changelog - Field changes
 * @returns {Promise<void>}
 */
export async function issueUpdatedHandler(event) {
  console.log('Issue updated trigger:', event);

  try {
    const issue = event.issue;
    const changelog = event.changelog;
    
    // Check if shipment-critical fields were changed
    const criticalFields = ['summary', 'description', 'labels', 'customfield'];
    const hasChipmentChanges = changelog?.items?.some(item => 
      criticalFields.some(field => item.field.toLowerCase().includes(field))
    );

    if (!hasChipmentChanges) {
      console.log('No shipment-critical changes detected');
      return;
    }

    console.log(`Shipment data changed for issue: ${issue.key}`);
    
    // Log update event
    await logToHashChain({
      action: 'issue_updated',
      userId: event.user?.accountId || 'system',
      shipmentId: issue.key,
      outcome: {
        changedFields: changelog?.items?.map(item => ({
          field: item.field,
          from: item.fromString,
          to: item.toString
        })) || [],
        timestamp: new Date().toISOString()
      }
    });

    // TODO: Re-run compliance validation if needed

  } catch (error) {
    console.error('Issue updated handler error:', error);
  }
}

/**
 * Confluence Macro Renderer
 * 
 * Renders verifiable logs and AI insights in Confluence pages.
 * Displays hash-verified decision chains with verification status.
 * 
 * @param {Object} config - Macro configuration
 * @param {string} config.shipmentId - Shipment/issue ID to display logs for
 * @returns {Object} Rendered macro content
 */
export async function logMacroRenderer(config) {
  console.log('Log macro renderer invoked:', config);

  try {
    const shipmentId = config.shipmentId || 'default';
    
    // Retrieve log chain from storage
    const chainKey = `shipment-${shipmentId}-chain`;
    const logChain = await storage.get(chainKey) || [];
    
    if (logChain.length === 0) {
      return {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: `No decision logs found for shipment: ${shipmentId}`
          }]
        }]
      };
    }

    // Verify chain integrity
    const { verifyChain } = await import('../reference/hashChain.js');
    const isValid = verifyChain(logChain);

    // Build Confluence ADF content
    const content = [{
      type: 'panel',
      attrs: {
        panelType: isValid ? 'success' : 'error'
      },
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: `Shipment: ${shipmentId} | Chain Status: ${isValid ? 'Verified ✓' : 'TAMPERED ✗'} | Entries: ${logChain.length}`,
          marks: [{ type: 'strong' }]
        }]
      }]
    }];

    // Add log entries
    logChain.forEach((entry, idx) => {
      content.push({
        type: 'paragraph',
        content: [{
          type: 'text',
          text: `${idx + 1}. ${entry.action} | ${new Date(entry.timestamp).toLocaleString()} | Hash: ${entry.hash.substring(0, 16)}...`
        }]
      });
    });

    return {
      type: 'doc',
      version: 1,
      content
    };

  } catch (error) {
    console.error('Log macro renderer error:', error);
    return {
      type: 'doc',
      version: 1,
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: `Error loading logs: ${error.message}`
        }]
      }]
    };
  }
}



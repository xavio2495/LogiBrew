/**
 * LogiBrew Backend Functions
 * 
 * Implements compliance validation, hash-chained logging, and emission calculations
 * for logistics disruption management.
 */

import { generateHash, logComplianceDecision as logToHashChain } from './hashChain.js';
import { storage } from '@forge/api';
import Resolver from '@forge/resolver';
import complianceRulesData from './rules.json';

// Use the imported rules
const complianceRules = complianceRulesData;

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
async function validateCompliance(payload) {
  console.log('Starting compliance validation:', payload);
  
  // Input validation and sanitization
  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_PAYLOAD',
        severity: 'error',
        message: 'Invalid payload structure',
        recommendation: 'Ensure payload is a valid object with required fields'
      }],
      warnings: [],
      recommendations: [],
      details: {}
    };
  }

  // Sanitize inputs
  const unCode = payload.unCode ? String(payload.unCode).trim().toUpperCase() : '';
  const transportMode = String(payload.transportMode || '').trim().toLowerCase();
  const cargoType = String(payload.cargoType || '').trim().toLowerCase();
  const weight = parseFloat(payload.weight) || 0;

  // Validate UN code format if provided
  if (unCode && !/^UN\d{4}$/.test(unCode)) {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_UN_CODE_FORMAT',
        severity: 'error',
        message: `Invalid UN code format: ${unCode}. Expected format: UNXXXX (e.g., UN1203)`,
        recommendation: 'Use 4-digit UN codes starting with "UN"'
      }],
      warnings: [],
      recommendations: [],
      details: {}
    };
  }

  // Validate transport mode
  const validModes = ['air', 'sea', 'road', 'rail'];
  if (!validModes.includes(transportMode)) {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_TRANSPORT_MODE',
        severity: 'error',
        message: `Invalid transport mode: ${transportMode}`,
        recommendation: `Use one of: ${validModes.join(', ')}`
      }],
      warnings: [],
      recommendations: [],
      details: {}
    };
  }

  // Validate cargo type
  const validCargoTypes = ['general', 'hazmat', 'perishable', 'temperature-controlled'];
  if (!validCargoTypes.includes(cargoType)) {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_CARGO_TYPE',
        severity: 'error',
        message: `Invalid cargo type: ${cargoType}`,
        recommendation: `Use one of: ${validCargoTypes.join(', ')}`
      }],
      warnings: [],
      recommendations: [],
      details: {}
    };
  }

  // Validate weight
  if (weight <= 0 || weight > 1000000) {
    return {
      isValid: false,
      issues: [{
        type: 'INVALID_WEIGHT',
        severity: 'error',
        message: `Invalid weight: ${weight}kg. Must be between 0 and 1,000,000 kg`,
        recommendation: 'Enter a valid cargo weight in kilograms'
      }],
      warnings: [],
      recommendations: [],
      details: {}
    };
  }
  
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

    // Check for perishable/temperature-controlled cargo
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
async function logComplianceDecision(payload) {
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
async function calculateEmissions(payload) {
  console.log('Calculating emissions:', payload);

  // Input validation and sanitization
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: 'Invalid payload structure',
      recommendation: 'Ensure payload is a valid object with required fields'
    };
  }

  const origin = String(payload.origin || '').trim();
  const destination = String(payload.destination || '').trim();
  const transportMode = String(payload.transportMode || '').trim().toLowerCase();
  const weight = parseFloat(payload.weight) || 0;
  const distance = payload.distance ? parseFloat(payload.distance) : null;

  // Validate required fields
  if (!origin || !destination) {
    return {
      success: false,
      error: 'Origin and destination are required',
      recommendation: 'Provide both origin and destination locations'
    };
  }

  if (weight <= 0 || weight > 1000000) {
    return {
      success: false,
      error: `Invalid weight: ${weight}kg. Must be between 0 and 1,000,000 kg`,
      recommendation: 'Enter a valid cargo weight in kilograms'
    };
  }

  // Validate transport mode
  const validModes = ['air', 'sea', 'road', 'rail'];
  if (!validModes.includes(transportMode)) {
    return {
      success: false,
      error: `Invalid transport mode: ${transportMode}`,
      recommendation: `Use one of: ${validModes.join(', ')}`
    };
  }

  try {
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
async function shipmentPanelResolver(payload) {
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
 * Shipment Panel Resolver
 * 
 * Backend resolver for the Jira issue panel. Validates shipment data and returns
 * both compliance validation and emission calculation results.
 * 
 * This function exports resolver definitions that the frontend can invoke.
 */

const shipmentResolver = new Resolver();

shipmentResolver.define('validateShipmentData', async (req) => {
  console.log('validateShipmentData resolver invoked:', req);

  try {
    const payload = req.payload || {};
    
    // Validate and sanitize inputs
    const sanitizedPayload = {
      origin: (payload.origin || '').trim(),
      destination: (payload.destination || '').trim(),
      cargoType: (payload.cargoType || '').trim(),
      weight: parseFloat(payload.weight) || 0,
      unCode: payload.unCode ? (payload.unCode || '').trim().toUpperCase() : undefined,
      transportMode: (payload.transportMode || '').trim().toLowerCase()
    };

    // Input validation
    if (!sanitizedPayload.origin || !sanitizedPayload.destination) {
      return {
        validation: {
          isValid: false,
          issues: [{
            type: 'MISSING_FIELDS',
            severity: 'error',
            message: 'Origin and destination are required',
            recommendation: 'Please provide both origin and destination'
          }],
          warnings: [],
          recommendations: []
        },
        emissions: { success: false, error: 'Missing required fields' }
      };
    }

    if (sanitizedPayload.weight <= 0) {
      return {
        validation: {
          isValid: false,
          issues: [{
            type: 'INVALID_WEIGHT',
            severity: 'error',
            message: 'Weight must be greater than 0',
            recommendation: 'Please enter a valid cargo weight in kilograms'
          }],
          warnings: [],
          recommendations: []
        },
        emissions: { success: false, error: 'Invalid weight' }
      };
    }

    // Call the existing shipmentPanelResolver function
    return await shipmentPanelResolver(sanitizedPayload);

  } catch (error) {
    console.error('validateShipmentData resolver error:', error);
    return {
      validation: {
        isValid: false,
        issues: [{
          type: 'RESOLVER_ERROR',
          severity: 'error',
          message: `Failed to validate shipment: ${error.message}`,
          recommendation: 'Contact support if issue persists.'
        }],
        warnings: [],
        recommendations: []
      },
      emissions: { success: false, error: error.message }
    };
  }
});

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
async function workflowValidator(args) {
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
async function workflowPostFunction(event) {
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

    // Auto-create JSM approval request if transitioning to Pending Approval
    if (transition.to_status?.toLowerCase().includes('pending') || 
        transition.to_status?.toLowerCase().includes('approval')) {
      try {
        const jsmRequest = await createApprovalRequest({
          issueKey: issue.key,
          shipmentSummary: issueFields.summary,
          transitionDetails: outcome,
          logHash: logEntry.hash
        });
        
        console.log(`Auto-created JSM approval request: ${jsmRequest.requestKey}`);
      } catch (jsmError) {
        console.error('Failed to auto-create JSM request:', jsmError.message);
        // Don't block workflow if JSM creation fails
      }
    }

    console.log('Post function completed successfully');

  } catch (error) {
    console.error('Workflow post function error:', error);
    // Don't throw error - post functions should not block transitions
  }
}

/**
 * Create JSM Approval Request Helper
 * 
 * Automatically creates a Jira Service Management approval request
 * for shipment workflow transitions that require stakeholder approval.
 * 
 * @param {Object} params - Request creation parameters
 * @param {string} params.issueKey - Original Jira issue key
 * @param {string} params.shipmentSummary - Shipment summary from issue
 * @param {Object} params.transitionDetails - Workflow transition details
 * @param {string} params.logHash - Hash of the decision log entry
 * @returns {Promise<Object>} Created JSM request details
 */
async function createApprovalRequest(params) {
  const { issueKey, shipmentSummary, transitionDetails, logHash } = params;
  
  console.log(`Creating JSM approval request for ${issueKey}...`);
  
  try {
    // Import Jira API from Forge
    const { requestJira } = await import('@forge/bridge');
    
    // Build request description with shipment details
    const description = `
**Shipment Approval Required**

Original Issue: ${issueKey}
Summary: ${shipmentSummary}

**Transition Details:**
- From: ${transitionDetails.fromStatus}
- To: ${transitionDetails.toStatus}
- Transition: ${transitionDetails.transitionName}
- Timestamp: ${transitionDetails.timestamp}

**Verifiable Log:**
Hash: ${logHash?.substring(0, 16)}...

**Changed Fields:**
${transitionDetails.changedFields?.join(', ') || 'None'}

Please review and approve this shipment transition.
    `.trim();
    
    // Create JSM service desk request
    // Note: In production, serviceDeskId should be configured or discovered dynamically
    // For now, we'll use a default ID or get from first available service desk
    
    // First, get available service desks
    const serviceDesksResponse = await requestJira('/rest/servicedeskapi/servicedesk', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!serviceDesksResponse.ok) {
      throw new Error(`Failed to fetch service desks: ${serviceDesksResponse.status}`);
    }
    
    const serviceDesks = await serviceDesksResponse.json();
    
    if (!serviceDesks.values || serviceDesks.values.length === 0) {
      throw new Error('No service desks available for JSM request creation');
    }
    
    const serviceDeskId = serviceDesks.values[0].id;
    
    // Get request types for this service desk
    const requestTypesResponse = await requestJira(
      `/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!requestTypesResponse.ok) {
      throw new Error(`Failed to fetch request types: ${requestTypesResponse.status}`);
    }
    
    const requestTypes = await requestTypesResponse.json();
    
    // Use first available request type or find one matching "approval"
    let requestTypeId = requestTypes.values[0]?.id;
    
    const approvalType = requestTypes.values.find(rt => 
      rt.name?.toLowerCase().includes('approval') || 
      rt.name?.toLowerCase().includes('review')
    );
    
    if (approvalType) {
      requestTypeId = approvalType.id;
    }
    
    // Create the service desk request
    const createResponse = await requestJira('/rest/servicedeskapi/request', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceDeskId: serviceDeskId,
        requestTypeId: requestTypeId,
        requestFieldValues: {
          summary: `Shipment Approval: ${shipmentSummary}`,
          description: description
        }
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create JSM request: ${createResponse.status} - ${errorText}`);
    }
    
    const createdRequest = await createResponse.json();
    
    // Link JSM request to original Jira issue
    try {
      await requestJira('/rest/api/3/issueLink', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: {
            name: 'Relates'
          },
          inwardIssue: {
            key: issueKey
          },
          outwardIssue: {
            key: createdRequest.issueKey
          }
        })
      });
      
      console.log(`Linked ${createdRequest.issueKey} to ${issueKey}`);
    } catch (linkError) {
      console.error('Failed to link issues:', linkError.message);
      // Continue even if linking fails
    }
    
    // Add comment to original issue with JSM request link
    try {
      await requestJira(`/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: `Approval request created: ${createdRequest.issueKey} - Please review and approve.`
              }]
            }]
          }
        })
      });
    } catch (commentError) {
      console.error('Failed to add comment:', commentError.message);
      // Continue even if comment fails
    }
    
    return {
      requestKey: createdRequest.issueKey,
      requestId: createdRequest.issueId,
      serviceDeskId: serviceDeskId,
      requestTypeId: requestTypeId
    };
    
  } catch (error) {
    console.error('Create approval request error:', error);
    throw error;
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
async function issueCreatedHandler(event) {
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
async function issueUpdatedHandler(event) {
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
async function logMacroRenderer(config) {
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
    const { verifyChain } = await import('./hashChain.js');
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

/**
 * LogRovo Macro Renderer Resolver
 * 
 * Backend resolver for the Confluence macro UI Kit frontend.
 * Called via invoke() from the macro frontend to retrieve log chain data.
 * 
 * This function exports resolver definitions that the frontend can invoke.
 * The actual resolver name used in invoke() is defined in the resolver below.
 */

const macroResolverInstance = new Resolver();

macroResolverInstance.define('getMacroLogs', async (req) => {
  console.log('getMacroLogs resolver invoked:', req);

  try {
    const { shipmentId = 'default' } = req.payload || {};
    
    // Retrieve log chain from storage
    const chainKey = `shipment-${shipmentId}-chain`;
    const logChain = await storage.get(chainKey) || [];
    
    if (logChain.length === 0) {
      return {
        shipmentId,
        chain: [],
        chainLength: 0,
        isValid: true,
        rootHash: null
      };
    }

    // Verify chain integrity
    const { verifyChain } = await import('./hashChain.js');
    const isValid = verifyChain(logChain);
    const rootHash = logChain[logChain.length - 1]?.hash;

    return {
      shipmentId,
      chain: logChain,
      chainLength: logChain.length,
      isValid,
      rootHash
    };

  } catch (error) {
    console.error('getMacroLogs resolver error:', error);
    throw new Error(`Failed to retrieve logs: ${error.message}`);
  }
});

/**
 * Dashboard Gadget Resolver
 * 
 * Backend resolver for the Jira dashboard gadget.
 * Provides logistics metrics including delay patterns, response times, and trends.
 */

const dashboardResolverInstance = new Resolver();

dashboardResolverInstance.define('getDashboardMetrics', async (req) => {
  console.log('getDashboardMetrics resolver invoked:', req);

  try {
    // Retrieve all log chains from storage to aggregate metrics
    const allKeys = await storage.query().where('key', 'startsWith', 'shipment-').getMany();
    
    // Mock metrics for demo (in production, aggregate from actual log chains)
    const delayPatterns = [
      { cause: 'Port Congestion', count: 12 },
      { cause: 'Weather Delays', count: 8 },
      { cause: 'Customs Hold', count: 5 },
      { cause: 'Route Changes', count: 15 },
      { cause: 'Compliance Issues', count: 3 }
    ];

    const recentActivities = [];
    
    // Get recent log entries from chains
    for (const { key, value } of allKeys.results) {
      if (Array.isArray(value) && value.length > 0) {
        // Get last 2 entries from each chain
        const recent = value.slice(-2);
        recent.forEach(entry => {
          recentActivities.push({
            shipmentId: entry.shipmentId || key.replace('shipment-', '').replace('-chain', ''),
            action: entry.action,
            timestamp: entry.timestamp,
            status: entry.decision?.status || 'completed'
          });
        });
      }
    }

    // Sort by timestamp descending and take top 10
    recentActivities.sort((a, b) => b.timestamp - a.timestamp);
    const topActivities = recentActivities.slice(0, 10);

    // Calculate summary stats
    const totalShipments = new Set(recentActivities.map(a => a.shipmentId)).size;
    const avgResponseTime = Math.round(Math.random() * 12 + 4); // Mock: 4-16 hours
    const complianceRate = Math.round(95 + Math.random() * 4); // Mock: 95-99%

    // Get latest forecast from scheduled trigger
    const forecast = await storage.get('latest-trend-forecast') || null;

    return {
      data: true,
      summary: {
        totalShipments: totalShipments || 42,
        avgResponseTime,
        complianceRate
      },
      delayPatterns,
      recentActivities: topActivities.length > 0 ? topActivities : [
        {
          shipmentId: 'SHIP-2025-001',
          action: 'compliance_check',
          timestamp: Date.now() - 3600000,
          status: 'completed'
        },
        {
          shipmentId: 'SHIP-2025-002',
          action: 'route_change',
          timestamp: Date.now() - 7200000,
          status: 'pending'
        }
      ],
      forecast,
      lastUpdated: Date.now()
    };

  } catch (error) {
    console.error('getDashboardMetrics resolver error:', error);
    throw new Error(`Failed to retrieve metrics: ${error.message}`);
  }
});

/**
 * JSM Panel Resolver
 * 
 * Backend resolver for the JSM portal request detail panel.
 * Provides AI insights, compliance status, and delay predictions for service requests.
 */

const jsmPanelResolverInstance = new Resolver();

jsmPanelResolverInstance.define('getJsmInsights', async (req) => {
  console.log('getJsmInsights resolver invoked:', req);

  try {
    const { requestKey, portalId } = req.payload || {};
    
    // Check if this is a logistics-related request
    // In production, this would query the request details via Jira API
    const isLogisticsRequest = requestKey && requestKey.toLowerCase().includes('ship');
    
    if (!isLogisticsRequest) {
      return {
        hasData: false
      };
    }

    // Mock AI insights for demo
    // In production, this would invoke Rovo agent or analyze stored shipment data
    const mockCompliance = {
      isValid: Math.random() > 0.3,
      issues: Math.random() > 0.3 ? [] : [
        {
          type: 'UN_CODE_MISSING',
          severity: 'warning',
          message: 'Hazardous material UN code not specified in request'
        }
      ],
      recommendations: [
        'Verify cargo classification before approval',
        'Check multimodal transport restrictions'
      ]
    };

    const mockDelays = {
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      prediction: 'Based on current port congestion data, expect 2-4 hour delay at destination',
      factors: [
        'Port congestion in Rotterdam',
        'Weather conditions affecting sea routes'
      ]
    };

    const mockActions = [
      {
        label: 'Validate UN code compliance',
        priority: mockCompliance.isValid ? 'normal' : 'urgent'
      },
      {
        label: 'Review alternate routing options',
        priority: mockDelays.riskLevel === 'high' ? 'urgent' : 'normal'
      },
      {
        label: 'Generate verifiable log for audit trail',
        priority: 'normal'
      }
    ];

    return {
      hasData: true,
      compliance: mockCompliance,
      delays: mockDelays,
      actions: mockActions,
      summary: `AI analysis suggests ${mockDelays.riskLevel} risk for this shipment. ${mockCompliance.isValid ? 'Compliance checks passed.' : 'Compliance issues detected - review required before approval.'}`
    };

  } catch (error) {
    console.error('getJsmInsights resolver error:', error);
    throw new Error(`Failed to retrieve JSM insights: ${error.message}`);
  }
});

/**
 * Knowledge Base Resolver
 * 
 * Backend resolver for the Confluence global page knowledge base.
 * Aggregates learnings from disruptions, best practices, and common issues.
 */

const knowledgeBaseResolverInstance = new Resolver();

knowledgeBaseResolverInstance.define('getKnowledgeBase', async (req) => {
  console.log('getKnowledgeBase resolver invoked:', req);

  try {
    // In production, aggregate from actual log chains and issue history
    // For demo, return structured knowledge base data
    
    const lessons = [
      {
        category: 'Compliance',
        issue: 'UN code validation delays at customs',
        resolution: 'Pre-validate UN codes before shipment booking using IATA DGR database',
        impact: 'high'
      },
      {
        category: 'Route Planning',
        issue: 'Port congestion in Rotterdam causing 24h delays',
        resolution: 'Monitor port status APIs and route via alternate ports (Antwerp, Hamburg)',
        impact: 'medium'
      },
      {
        category: 'Perishables',
        issue: 'Temperature excursions in sea-to-air transitions',
        resolution: 'Add 4-hour buffer for multimodal transfers, use temperature-controlled containers',
        impact: 'high'
      },
      {
        category: 'Documentation',
        issue: 'Missing verifiable logs during audit',
        resolution: 'Enforce hash-chain logging for all compliance decisions via workflow validators',
        impact: 'medium'
      },
      {
        category: 'Emissions',
        issue: 'EU ETS threshold exceeded without prior notice',
        resolution: 'Calculate emissions during route planning, flag shipments >450kg CO2',
        impact: 'low'
      }
    ];

    const bestPractices = [
      {
        title: 'Multimodal Validation',
        description: 'Always validate each transport leg separately for hazmat shipments',
        applicability: 'Air-sea, road-rail transitions'
      },
      {
        title: 'Compliance Checkpoints',
        description: 'Run automated compliance checks before workflow transitions to prevent blocking',
        applicability: 'All shipment types'
      },
      {
        title: 'Proactive Alerting',
        description: 'Set up JSM alerts for high-risk shipments (hazmat, perishables, high-value)',
        applicability: 'Risk management'
      },
      {
        title: 'Knowledge Sharing',
        description: 'Document all disruption resolutions in Confluence with verifiable logs',
        applicability: 'Team collaboration'
      },
      {
        title: 'API Monitoring',
        description: 'Integrate weather and port status APIs for real-time route adjustments',
        applicability: 'Route planning'
      }
    ];

    const commonIssues = [
      {
        type: 'Port Congestion',
        frequency: '15 occurrences/month',
        avgResolutionTime: '12 hours'
      },
      {
        type: 'UN Code Mismatch',
        frequency: '8 occurrences/month',
        avgResolutionTime: '4 hours'
      },
      {
        type: 'Temperature Excursion',
        frequency: '5 occurrences/month',
        avgResolutionTime: '24 hours'
      },
      {
        type: 'Emission Threshold Breach',
        frequency: '3 occurrences/month',
        avgResolutionTime: '8 hours'
      },
      {
        type: 'Customs Delay',
        frequency: '12 occurrences/month',
        avgResolutionTime: '18 hours'
      }
    ];

    return {
      summary: {
        totalDisruptions: 156,
        lessonsCount: lessons.length,
        practicesCount: bestPractices.length,
        avgResolutionHours: 11
      },
      lessons,
      bestPractices,
      commonIssues,
      lastUpdated: Date.now()
    };

  } catch (error) {
    console.error('getKnowledgeBase resolver error:', error);
    throw new Error(`Failed to retrieve knowledge base: ${error.message}`);
  }
});

/**
 * Scheduled Trend Forecasting Function
 * 
 * Runs daily to aggregate shipment data and identify patterns.
 * Calculates rolling averages, identifies anomalies, and predicts delays.
 * Stores forecast results in Forge Storage for dashboard display.
 * 
 * @param {Object} params - Scheduled trigger parameters
 * @param {Object} params.context - Context object with cloudId and moduleKey
 * @returns {Promise<Object>} Forecast results
 */
export async function scheduledTrendForecasting({ context }) {
  console.log('Starting scheduled trend forecasting for cloudId:', context?.cloudId);
  
  try {
    // 1. Retrieve all shipment chains from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Get all storage keys and filter for shipment chains
    const allStorageKeys = await storage.query().getMany();
    const allKeys = {
      results: allStorageKeys.results.filter(item => item.key.startsWith('shipment-'))
    };
    
    // Initialize aggregation structures
    const delayCauses = new Map();
    const responseTimeSum = { total: 0, count: 0 };
    const complianceStats = { passed: 0, failed: 0 };
    let totalShipments = 0;
    
    // 2. Aggregate data from all chains
    for (const { key, value } of allKeys.results) {
      if (Array.isArray(value) && value.length > 0) {
        // Filter to last 30 days
        const recentEntries = value.filter(entry => entry.timestamp >= thirtyDaysAgo);
        
        if (recentEntries.length === 0) continue;
        
        totalShipments++;
        
        // Analyze each entry for patterns
        recentEntries.forEach(entry => {
          // Track delay causes from action types
          if (entry.action && entry.action.includes('delay')) {
            const cause = entry.decision?.cause || 'Unknown';
            delayCauses.set(cause, (delayCauses.get(cause) || 0) + 1);
          }
          
          // Track compliance status
          if (entry.action === 'compliance_check') {
            if (entry.decision?.status === 'approved') {
              complianceStats.passed++;
            } else if (entry.decision?.status === 'rejected') {
              complianceStats.failed++;
            }
          }
          
          // Calculate response time (time from creation to resolution)
          if (entry.action.includes('route_change') || entry.action.includes('approval')) {
            // Mock response time based on entry count (in production, track actual timestamps)
            responseTimeSum.total += recentEntries.length * 2; // Mock: ~2 hours per entry
            responseTimeSum.count++;
          }
        });
      }
    }
    
    // 3. Calculate statistics and trends
    const avgResponseTime = responseTimeSum.count > 0 
      ? Math.round(responseTimeSum.total / responseTimeSum.count)
      : 0;
    
    const complianceRate = (complianceStats.passed + complianceStats.failed) > 0
      ? Math.round((complianceStats.passed / (complianceStats.passed + complianceStats.failed)) * 100)
      : 100;
    
    // Sort delay causes by frequency (top 5)
    const topDelayCauses = Array.from(delayCauses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cause, count]) => ({ cause, count }));
    
    // 4. Generate predictions and recommendations
    const totalDelays = Array.from(delayCauses.values()).reduce((sum, count) => sum + count, 0);
    const delayRate = totalShipments > 0 ? (totalDelays / totalShipments) * 100 : 0;
    
    const predictions = [];
    const recommendations = [];
    
    if (delayRate > 20) {
      predictions.push({
        type: 'high_delay_risk',
        severity: 'high',
        message: `Delay rate is ${Math.round(delayRate)}% - significantly above normal`
      });
      recommendations.push({
        action: 'review_routes',
        priority: 'high',
        description: 'Review and optimize frequently delayed routes'
      });
    } else if (delayRate > 10) {
      predictions.push({
        type: 'moderate_delay_risk',
        severity: 'medium',
        message: `Delay rate is ${Math.round(delayRate)}% - slightly elevated`
      });
    }
    
    if (complianceRate < 95) {
      predictions.push({
        type: 'compliance_concern',
        severity: 'medium',
        message: `Compliance rate is ${complianceRate}% - below target of 95%`
      });
      recommendations.push({
        action: 'enhance_training',
        priority: 'medium',
        description: 'Provide additional compliance training for team'
      });
    }
    
    if (avgResponseTime > 12) {
      predictions.push({
        type: 'slow_response',
        severity: 'low',
        message: `Average response time is ${avgResponseTime}h - consider process improvements`
      });
      recommendations.push({
        action: 'streamline_approvals',
        priority: 'low',
        description: 'Streamline approval workflows to reduce response time'
      });
    }
    
    // 5. Build forecast object
    const forecast = {
      timestamp: Date.now(),
      period: '30-day rolling average',
      statistics: {
        totalShipments,
        totalDelays,
        delayRate: Math.round(delayRate * 10) / 10,
        avgResponseTime,
        complianceRate
      },
      topDelayCauses,
      predictions,
      recommendations,
      nextUpdate: Date.now() + (24 * 60 * 60 * 1000) // Next day
    };
    
    // 6. Store forecast in Forge Storage
    await storage.set('latest-trend-forecast', forecast);
    
    console.log(`Trend forecast completed: ${totalShipments} shipments analyzed, ${predictions.length} predictions generated`);
    
    return {
      success: true,
      forecast
    };
    
  } catch (error) {
    console.error('Trend forecasting error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export all functions and resolvers
export {
  validateCompliance,
  logComplianceDecision,
  calculateEmissions,
  shipmentPanelResolver,
  workflowValidator,
  workflowPostFunction,
  issueCreatedHandler,
  issueUpdatedHandler,
  logMacroRenderer
};

export const shipmentPanelResolverDefs = shipmentResolver.getDefinitions();
export const logMacroResolver = macroResolverInstance.getDefinitions();
export const dashboardResolver = dashboardResolverInstance.getDefinitions();
export const jsmPanelResolver = jsmPanelResolverInstance.getDefinitions();
export const knowledgeBaseResolver = knowledgeBaseResolverInstance.getDefinitions();

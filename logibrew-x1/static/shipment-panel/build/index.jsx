import React, { useState, useEffect } from 'react';
import ForgeReconciler, { 
  Form, 
  FormSection, 
  FormFooter,
  Textfield, 
  Select,
  Button,
  SectionMessage,
  Stack,
  Heading,
  Text,
  Inline,
  Lozenge
} from '@forge/react';
import { invoke } from '@forge/bridge';

/**
 * LogiBrew Shipment Data Panel
 * 
 * Main UI component for entering and validating shipment details on Jira issues.
 * Uses @forge/react components ONLY - no standard React/HTML components allowed.
 */
const ShipmentPanel = () => {
  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [weight, setWeight] = useState('');
  const [unCode, setUnCode] = useState('');
  const [transportMode, setTransportMode] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [emissionResult, setEmissionResult] = useState(null);

  /**
   * Handle form submission and trigger compliance validation
   */
  const handleValidate = async () => {
    setIsSubmitting(true);
    setValidationResult(null);
    setEmissionResult(null);

    try {
      // Call backend resolver to validate compliance
      const result = await invoke('validateShipmentData', {
        origin,
        destination,
        cargoType,
        weight: parseFloat(weight),
        unCode: unCode || undefined,
        transportMode
      });

      setValidationResult(result.validation);
      setEmissionResult(result.emissions);
    } catch (error) {
      setValidationResult({
        isValid: false,
        issues: [{
          type: 'ERROR',
          severity: 'error',
          message: `Validation failed: ${error.message}`,
          recommendation: 'Please check your input and try again.'
        }],
        warnings: [],
        recommendations: []
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render validation results as SectionMessage components
   */
  const renderValidationResults = () => {
    if (!validationResult) return null;

    return (
      <Stack space="space.100">
        {/* Show errors if any */}
        {validationResult.issues && validationResult.issues.length > 0 && (
          <SectionMessage appearance="error" title="Compliance Issues">
            <Stack space="space.050">
              {validationResult.issues.map((issue, idx) => (
                <Text key={idx}>
                  <Text weight="bold">{issue.type}:</Text> {issue.message}
                  {issue.recommendation && (
                    <Text> <Em>Recommendation:</Em> {issue.recommendation}</Text>
                  )}
                </Text>
              ))}
            </Stack>
          </SectionMessage>
        )}

        {/* Show warnings */}
        {validationResult.warnings && validationResult.warnings.length > 0 && (
          <SectionMessage appearance="warning" title="Warnings">
            <Stack space="space.050">
              {validationResult.warnings.map((warning, idx) => (
                <Text key={idx}>
                  {warning.message}
                  {warning.recommendation && (
                    <Text> <Em>Recommendation:</Em> {warning.recommendation}</Text>
                  )}
                </Text>
              ))}
            </Stack>
          </SectionMessage>
        )}

        {/* Show success */}
        {validationResult.isValid && validationResult.warnings.length === 0 && (
          <SectionMessage appearance="success" title="Validation Passed">
            <Text>Shipment meets all compliance requirements.</Text>
          </SectionMessage>
        )}

        {/* Show recommendations */}
        {validationResult.recommendations && validationResult.recommendations.length > 0 && (
          <SectionMessage appearance="info" title="Recommendations">
            <Stack space="space.050">
              {validationResult.recommendations.map((rec, idx) => (
                <Text key={idx}>• {rec}</Text>
              ))}
            </Stack>
          </SectionMessage>
        )}
      </Stack>
    );
  };

  /**
   * Render emission calculation results
   */
  const renderEmissionResults = () => {
    if (!emissionResult || !emissionResult.success) return null;

    const { emissions, compliance } = emissionResult;

    return (
      <Stack space="space.100">
        <Heading size="small">Carbon Emissions</Heading>
        <Inline space="space.100">
          <Text weight="bold">Total:</Text>
          <Text>{emissions.total} {emissions.unit}</Text>
          {compliance.euEts.exceeded && (
            <Lozenge appearance="removed">EU ETS Reporting Required</Lozenge>
          )}
          {compliance.carbonOffset.recommended && (
            <Lozenge appearance="moved">Offset Recommended</Lozenge>
          )}
        </Inline>
        {emissionResult.recommendations && emissionResult.recommendations.length > 0 && (
          <SectionMessage appearance="info">
            <Stack space="space.050">
              {emissionResult.recommendations.map((rec, idx) => (
                <Text key={idx}>• {rec}</Text>
              ))}
            </Stack>
          </SectionMessage>
        )}
      </Stack>
    );
  };

  return (
    <Form onSubmit={handleValidate}>
      <FormSection>
        <Heading size="medium">Shipment Details</Heading>
        
        {/* Route Information */}
        <Textfield
          label="Origin Location"
          value={origin}
          onChange={setOrigin}
          isRequired
          placeholder="e.g., Singapore, SGSIN"
        />
        
        <Textfield
          label="Destination Location"
          value={destination}
          onChange={setDestination}
          isRequired
          placeholder="e.g., Rotterdam, NLRTM"
        />

        {/* Cargo Details */}
        <Select
          label="Cargo Type"
          value={cargoType}
          onChange={setCargoType}
          isRequired
        >
          <option value="">Select cargo type...</option>
          <option value="general">General Cargo</option>
          <option value="hazmat">Hazardous Materials</option>
          <option value="perishable">Perishable Goods</option>
          <option value="temperature-controlled">Temperature-Controlled</option>
        </Select>

        <Textfield
          label="Cargo Weight (kg)"
          value={weight}
          onChange={setWeight}
          isRequired
          type="number"
          placeholder="e.g., 5000"
        />

        {/* Show UN Code field only for hazmat */}
        {cargoType === 'hazmat' && (
          <Textfield
            label="UN Hazmat Code"
            value={unCode}
            onChange={setUnCode}
            placeholder="e.g., UN1203, UN2814"
          />
        )}

        {/* Transport Mode */}
        <Select
          label="Primary Transport Mode"
          value={transportMode}
          onChange={setTransportMode}
          isRequired
        >
          <option value="">Select transport mode...</option>
          <option value="air">Air</option>
          <option value="sea">Sea</option>
          <option value="road">Road</option>
          <option value="rail">Rail</option>
        </Select>
      </FormSection>

      <FormFooter>
        <Button 
          appearance="primary" 
          type="submit" 
          isDisabled={isSubmitting || !origin || !destination || !cargoType || !weight || !transportMode}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Validating...' : 'Validate Compliance'}
        </Button>
      </FormFooter>

      {/* Display validation and emission results */}
      {(validationResult || emissionResult) && (
        <Stack space="space.200">
          {renderValidationResults()}
          {renderEmissionResults()}
        </Stack>
      )}
    </Form>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <ShipmentPanel />
  </React.StrictMode>
);

/**
 * LogiBrew Shipment Data Panel - UI Kit Implementation
 * 
 * Main UI component for entering and validating shipment details on Jira issues.
 * Uses @forge/react UI Kit components ONLY.
 */

import React, { useState } from 'react';
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
  Lozenge,
  Spinner,
  Badge
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  // Form state
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    cargoType: '',
    weight: '',
    unCode: '',
    transportMode: ''
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [emissionResult, setEmissionResult] = useState(null);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission and trigger compliance validation
   */
  const handleSubmit = async (formEvent) => {
    formEvent.preventDefault();
    setIsSubmitting(true);
    setValidationResult(null);
    setEmissionResult(null);

    try {
      // Call backend resolver to validate compliance
      const result = await invoke('validateShipmentData', {
        origin: formData.origin,
        destination: formData.destination,
        cargoType: formData.cargoType,
        weight: parseFloat(formData.weight) || 0,
        unCode: formData.unCode || undefined,
        transportMode: formData.transportMode
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
   * Render validation results
   */
  const renderValidationResults = () => {
    if (!validationResult) return null;

    return (
      <Stack space="space.200">
        {/* Compliance Issues */}
        {validationResult.issues && validationResult.issues.length > 0 && (
          <SectionMessage appearance="error" title="Compliance Issues">
            <Stack space="space.100">
              {validationResult.issues.map((issue, idx) => (
                <Stack key={idx} space="space.050">
                  <Inline space="space.100">
                    <Badge appearance="removed">{issue.type}</Badge>
                    <Text>{issue.message}</Text>
                  </Inline>
                  {issue.recommendation && (
                    <Text appearance="subtle">→ {issue.recommendation}</Text>
                  )}
                </Stack>
              ))}
            </Stack>
          </SectionMessage>
        )}

        {/* Warnings */}
        {validationResult.warnings && validationResult.warnings.length > 0 && (
          <SectionMessage appearance="warning" title="Warnings">
            <Stack space="space.100">
              {validationResult.warnings.map((warning, idx) => (
                <Stack key={idx} space="space.050">
                  <Inline space="space.100">
                    <Badge appearance="primary">{warning.type}</Badge>
                    <Text>{warning.message}</Text>
                  </Inline>
                  {warning.recommendation && (
                    <Text appearance="subtle">→ {warning.recommendation}</Text>
                  )}
                </Stack>
              ))}
            </Stack>
          </SectionMessage>
        )}

        {/* Success Message */}
        {validationResult.isValid && (!validationResult.warnings || validationResult.warnings.length === 0) && (
          <SectionMessage appearance="success" title="Validation Passed">
            <Text>Shipment meets all compliance requirements. Ready for booking.</Text>
          </SectionMessage>
        )}

        {/* Recommendations */}
        {validationResult.recommendations && validationResult.recommendations.length > 0 && (
          <SectionMessage appearance="information" title="Recommendations">
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

    return (
      <Stack space="space.200">
        <Heading size="small">Carbon Emissions Analysis</Heading>
        
        {/* Total Emissions */}
        <Inline space="space.100" alignBlock="center">
          <Text>Total Emissions:</Text>
          <Badge appearance={emissionResult.emissions.total > 500 ? 'removed' : 'success'}>
            {emissionResult.emissions.total} kg CO₂
          </Badge>
        </Inline>

        {/* EU ETS Compliance */}
        {emissionResult.compliance && emissionResult.compliance.euEts && (
          <SectionMessage 
            appearance={emissionResult.compliance.euEts.exceeded ? 'warning' : 'information'}
            title="EU ETS Compliance"
          >
            <Text>{emissionResult.compliance.euEts.notes}</Text>
          </SectionMessage>
        )}

        {/* Emission Breakdown */}
        <Stack space="space.050">
          <Text appearance="subtle">Breakdown:</Text>
          <Text>• Distance: {emissionResult.emissions.breakdown.distance} km</Text>
          <Text>• Weight: {emissionResult.emissions.breakdown.weight} kg</Text>
          <Text>• Mode: {emissionResult.emissions.breakdown.transportMode}</Text>
          <Text>• Factor: {emissionResult.emissions.breakdown.emissionFactor} kg CO₂/ton-km</Text>
        </Stack>

        {/* Recommendations */}
        {emissionResult.recommendations && emissionResult.recommendations.length > 0 && (
          <Stack space="space.050">
            <Text appearance="subtle">Recommendations:</Text>
            {emissionResult.recommendations.map((rec, idx) => (
              <Text key={idx}>→ {rec}</Text>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Stack space="space.300">
      <Heading size="medium">LogiBrew Shipment Manager</Heading>
      <Text appearance="subtle">
        Enter shipment details below to validate compliance and calculate emissions.
      </Text>

      <Form onSubmit={handleSubmit}>
        <FormSection>
          <Stack space="space.200">
            {/* Route Information */}
            <Textfield
              name="origin"
              label="Origin"
              placeholder="e.g., Singapore, SGSIN"
              value={formData.origin}
              onChange={(e) => handleFieldChange('origin', e.target.value)}
              isRequired
            />

            <Textfield
              name="destination"
              label="Destination"
              placeholder="e.g., Rotterdam, NLRTM"
              value={formData.destination}
              onChange={(e) => handleFieldChange('destination', e.target.value)}
              isRequired
            />

            {/* Cargo Details */}
            <Select
              name="cargoType"
              label="Cargo Type"
              value={formData.cargoType}
              onChange={(e) => handleFieldChange('cargoType', e.target.value)}
              isRequired
            >
              <option value="">Select cargo type</option>
              <option value="general">General Cargo</option>
              <option value="hazmat">Hazardous Materials (Hazmat)</option>
              <option value="perishable">Perishable Goods</option>
              <option value="temperature-controlled">Temperature-Controlled</option>
            </Select>

            <Textfield
              name="weight"
              label="Cargo Weight (kg)"
              type="number"
              placeholder="e.g., 5000"
              value={formData.weight}
              onChange={(e) => handleFieldChange('weight', e.target.value)}
              isRequired
            />

            {/* Hazmat-specific field */}
            {formData.cargoType === 'hazmat' && (
              <Textfield
                name="unCode"
                label="UN Hazmat Code"
                placeholder="e.g., UN1203, UN2814"
                description="Required for hazardous materials. Format: UNXXXX"
                value={formData.unCode}
                onChange={(e) => handleFieldChange('unCode', e.target.value)}
              />
            )}

            {/* Transport Mode */}
            <Select
              name="transportMode"
              label="Primary Transport Mode"
              value={formData.transportMode}
              onChange={(e) => handleFieldChange('transportMode', e.target.value)}
              isRequired
            >
              <option value="">Select transport mode</option>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
              <option value="road">Road</option>
              <option value="rail">Rail</option>
            </Select>
          </Stack>
        </FormSection>

        <FormFooter>
          <Button
            type="submit"
            appearance="primary"
            isDisabled={isSubmitting || !formData.origin || !formData.destination || !formData.cargoType || !formData.weight || !formData.transportMode}
          >
            {isSubmitting ? 'Validating...' : 'Validate Shipment'}
          </Button>
        </FormFooter>
      </Form>

      {/* Loading State */}
      {isSubmitting && (
        <Stack space="space.100" alignInline="center">
          <Spinner size="medium" />
          <Text>Running compliance checks and emission calculations...</Text>
        </Stack>
      )}

      {/* Results */}
      {!isSubmitting && (validationResult || emissionResult) && (
        <Stack space="space.300">
          {renderValidationResults()}
          {renderEmissionResults()}
        </Stack>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

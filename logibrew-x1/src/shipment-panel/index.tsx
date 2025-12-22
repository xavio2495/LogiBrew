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
  Label,
  Textfield, 
  Select,
  Button,
  SectionMessage,
  Stack,
  Heading,
  Text,
  Lozenge,
  Spinner,
  Badge
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App: React.FC = () => {
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
  const [validationResult, setValidationResult] = useState<any>(null);
  const [emissionResult, setEmissionResult] = useState<any>(null);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission and trigger compliance validation
   */
  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
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
      }) as { validation: any; emissions: any };

      setValidationResult(result.validation);
      setEmissionResult(result.emissions);
    } catch (error: unknown) {
      setValidationResult({
        isValid: false,
        issues: [{
          type: 'ERROR',
          severity: 'error',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,

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
              {validationResult.issues.map((issue: { type: string; message: string; recommendation?: string }, idx: number) => (
                <Stack key={idx} space="space.050">
                  <Stack space="space.050">
                    <Badge appearance="removed">{issue.type}</Badge>
                    <Text>{issue.message}</Text>
                  </Stack>
                  {issue.recommendation && (
                    <Text>→ {issue.recommendation}</Text>
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
              {validationResult.warnings.map((warning: { type: string; message: string; recommendation?: string }, idx: number) => (
                <Stack key={idx} space="space.050">
                  <Stack space="space.050">
                    <Badge appearance="primary">{warning.type}</Badge>
                    <Text>{warning.message}</Text>
                  </Stack>
                  {warning.recommendation && (
                    <Text>→ {warning.recommendation}</Text>
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
              {validationResult.recommendations.map((rec: string, idx: number) => (
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
        <Heading as="h3">Carbon Emissions Analysis</Heading>
        
        {/* Total Emissions */}
        <Stack space="space.050">
          <Text>Total Emissions:</Text>
          <Badge appearance={emissionResult.emissions.total > 500 ? 'removed' : 'default'}>
            {emissionResult.emissions.total} kg CO₂
          </Badge>
        </Stack>

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
          <Text>Breakdown:</Text>
          <Text>• Distance: {emissionResult.emissions.breakdown.distance} km</Text>
          <Text>• Weight: {emissionResult.emissions.breakdown.weight} kg</Text>
          <Text>• Mode: {emissionResult.emissions.breakdown.transportMode}</Text>
          <Text>• Factor: {emissionResult.emissions.breakdown.emissionFactor} kg CO₂/ton-km</Text>
        </Stack>

        {/* Recommendations */}
        {emissionResult.recommendations && emissionResult.recommendations.length > 0 && (
          <Stack space="space.050">
            <Text>Recommendations:</Text>
            {emissionResult.recommendations.map((rec: string, idx: number) => (
              <Text key={idx}>→ {rec}</Text>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Stack space="space.300">
      <Heading as="h2">LogiBrew Shipment Manager</Heading>
      <Text>
        Enter shipment details below to validate compliance and calculate emissions.
      </Text>

      <Form onSubmit={() => handleSubmit({ preventDefault: () => {} } as any)}>
        <FormSection>
          <Stack space="space.200">
            {/* Route Information */}
            <Label labelFor="origin">Origin</Label>
            <Textfield
              name="origin"
              id="origin"
              placeholder="e.g., Singapore, SGSIN"
              value={formData.origin}
              onChange={(e) => handleFieldChange('origin', e.target.value)}
              isRequired
            />

            <Label labelFor="destination">Destination</Label>
            <Textfield
              name="destination"
              id="destination"
              placeholder="e.g., Rotterdam, NLRTM"
              value={formData.destination}
              onChange={(e) => handleFieldChange('destination', e.target.value)}
              isRequired
            />

            {/* Cargo Details */}
            <Label labelFor="cargoType">Cargo Type</Label>
            <Select
              name="cargoType"
              id="cargoType"
              value={formData.cargoType}
              onChange={(e) => handleFieldChange('cargoType', e.target.value)}
              options={[
                { label: 'Select cargo type', value: '' },
                { label: 'General Cargo', value: 'general' },
                { label: 'Hazardous Materials', value: 'hazmat' },
                { label: 'Perishable Goods', value: 'perishable' },
                { label: 'Temperature-Controlled', value: 'temperature-controlled' }
              ]}
              isRequired
            />

            <Label labelFor="weight">Cargo Weight (kg)</Label>
            <Textfield
              name="weight"
              id="weight"
              type="number"
              placeholder="e.g., 5000"
              value={formData.weight}
              onChange={(e) => handleFieldChange('weight', e.target.value)}
              isRequired
            />

            {formData.cargoType === 'hazmat' && (
              <>
                <Label labelFor="unCode">UN Hazmat Code</Label>
                <Textfield
                  name="unCode"
                  id="unCode"
                  placeholder="e.g., UN1203, UN2814"
                  value={formData.unCode}
                  onChange={(e) => handleFieldChange('unCode', e.target.value)}
                />
                <Text>Required for hazardous materials. Format: UNXXXX</Text>
              </>
            )}

            {/* Transport Mode */}
            <Label labelFor="transportMode">Primary Transport Mode</Label>
            <Select
              name="transportMode"
              id="transportMode"
              value={formData.transportMode}
              onChange={(e) => handleFieldChange('transportMode', e.target.value)}
              options={[
                { label: 'Select transport mode', value: '' },
                { label: 'Air', value: 'air' },
                { label: 'Sea', value: 'sea' },
                { label: 'Road', value: 'road' },
                { label: 'Rail', value: 'rail' }
              ]}
              isRequired
            />
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
        <Stack space="space.100">
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

ForgeReconciler.render(<App />);

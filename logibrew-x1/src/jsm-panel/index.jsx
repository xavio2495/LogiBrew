/**
 * LogiBrew JSM Request Detail Panel - UI Kit Frontend
 * 
 * Displays AI insights and alerts for logistics-related service requests.
 * Shows compliance status, delay predictions, and recommended actions.
 */

import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Stack,
  Heading,
  Text,
  Spinner,
  SectionMessage,
  Badge,
  Inline,
  Button
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const App = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get JSM request context
        const ctx = await view.getContext();
        setContext(ctx);

        // Call backend resolver to get AI insights for this request
        const result = await invoke('getJsmInsights', {
          requestKey: ctx.extension.request.key,
          portalId: ctx.extension.portal.id
        });
        setInsights(result);
      } catch (err) {
        console.error('Failed to fetch JSM insights:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Stack space="space.200">
        <Spinner size="medium" />
        <Text>Loading AI insights...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <SectionMessage title="Error Loading Insights" appearance="error">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!insights || !insights.hasData) {
    return (
      <SectionMessage title="No Logistics Insights" appearance="info">
        <Text>
          This request doesn't appear to be logistics-related, or no AI insights are available yet.
          LogiBrew provides disruption analysis and compliance checks for shipment-related requests.
        </Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.300">
      {/* Compliance Status */}
      {insights.compliance && (
        <Stack space="space.100">
          <Inline space="space.100" alignBlock="center">
            <Heading size="small">Compliance Status</Heading>
            {insights.compliance.isValid ? (
              <Badge appearance="success">Valid</Badge>
            ) : (
              <Badge appearance="removed">Issues Found</Badge>
            )}
          </Inline>
          
          {!insights.compliance.isValid && insights.compliance.issues && (
            <SectionMessage appearance="warning">
              <Stack space="space.050">
                {insights.compliance.issues.map((issue, idx) => (
                  <Text key={idx}>• {issue.message}</Text>
                ))}
              </Stack>
            </SectionMessage>
          )}
          
          {insights.compliance.recommendations && insights.compliance.recommendations.length > 0 && (
            <Stack space="space.050">
              <Text appearance="subtle">Recommendations:</Text>
              {insights.compliance.recommendations.map((rec, idx) => (
                <Text key={idx}>→ {rec}</Text>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Delay Predictions */}
      {insights.delays && (
        <Stack space="space.100">
          <Inline space="space.100" alignBlock="center">
            <Heading size="small">Delay Risk</Heading>
            {insights.delays.riskLevel === 'high' ? (
              <Badge appearance="removed">High Risk</Badge>
            ) : insights.delays.riskLevel === 'medium' ? (
              <Badge appearance="primary">Medium Risk</Badge>
            ) : (
              <Badge appearance="success">Low Risk</Badge>
            )}
          </Inline>
          
          {insights.delays.prediction && (
            <SectionMessage 
              appearance={insights.delays.riskLevel === 'high' ? 'error' : 'info'}
            >
              <Text>{insights.delays.prediction}</Text>
            </SectionMessage>
          )}
          
          {insights.delays.factors && insights.delays.factors.length > 0 && (
            <Stack space="space.050">
              <Text appearance="subtle">Contributing factors:</Text>
              {insights.delays.factors.map((factor, idx) => (
                <Text key={idx}>• {factor}</Text>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Recommended Actions */}
      {insights.actions && insights.actions.length > 0 && (
        <Stack space="space.100">
          <Heading size="small">Recommended Actions</Heading>
          <Stack space="space.100">
            {insights.actions.map((action, idx) => (
              <Inline key={idx} space="space.100" alignBlock="center">
                <Text>{action.label}</Text>
                {action.priority === 'urgent' && (
                  <Badge appearance="removed">Urgent</Badge>
                )}
              </Inline>
            ))}
          </Stack>
        </Stack>
      )}

      {/* AI Summary */}
      {insights.summary && (
        <SectionMessage title="AI Analysis" appearance="information">
          <Text>{insights.summary}</Text>
        </SectionMessage>
      )}

      <Text appearance="subtle">
        Powered by LogiBrew AI | Request: {context?.extension.request.key}
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

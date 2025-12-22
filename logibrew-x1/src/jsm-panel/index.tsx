/**
 * LogiBrew JSM Request Detail Panel - UI Kit Frontend
 * 
 * Displays AI insights and alerts for logistics-related service requests.
 * Shows compliance status, delay predictions, and recommended actions.
 */

import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Stack,
  Heading,
  Text,
  Spinner,
  SectionMessage,
  Badge,
  Button
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const App: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<any>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

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
      } catch (err: unknown) {
        console.error('Failed to fetch JSM insights:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [retryTrigger]);

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
      <Stack space="space.200">
        <SectionMessage title="Error Loading Insights" appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
        <Button 
          appearance="primary" 
          onClick={() => setRetryTrigger(prev => prev + 1)}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  if (!insights || !insights.hasData) {
    return (
      <SectionMessage title="No Logistics Insights" appearance="information">
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
          <Stack space="space.100">
            <Heading as="h3">Compliance Status</Heading>
            {insights.compliance.isValid ? (
              <Badge>Valid</Badge>
            ) : (
              <Badge appearance="removed">Issues Found</Badge>
            )}
          </Stack>
          
          {!insights.compliance.isValid && insights.compliance.issues && (
            <SectionMessage appearance="warning">
              <Stack space="space.050">
                {insights.compliance.issues.map((issue: { message: string }, idx: number) => (
                  <Text key={idx}>• {issue.message}</Text>
                ))}
              </Stack>
            </SectionMessage>
          )}
          
          {insights.compliance.recommendations && insights.compliance.recommendations.length > 0 && (
            <Stack space="space.050">
              <Text>Recommendations:</Text>
              {insights.compliance.recommendations.map((rec: string, idx: number) => (
                <Text key={idx}>→ {rec}</Text>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Delay Predictions */}
      {insights.delays && (
        <Stack space="space.100">
          <Stack space="space.100">
            <Heading as="h3">Delay Risk</Heading>
            {insights.delays.riskLevel === 'high' ? (
              <Badge appearance="removed">High Risk</Badge>
            ) : insights.delays.riskLevel === 'medium' ? (
              <Badge appearance="primary">Medium Risk</Badge>
            ) : (
              <Badge>Low Risk</Badge>
            )}
          </Stack>
          
          {insights.delays.prediction && (
            <SectionMessage 
              appearance={insights.delays.riskLevel === 'high' ? 'error' : 'information'}
            >
              <Text>{insights.delays.prediction}</Text>
            </SectionMessage>
          )}
          
          {insights.delays.factors && insights.delays.factors.length > 0 && (
            <Stack space="space.050">
              <Text>Contributing factors:</Text>
              {insights.delays.factors.map((factor: string, idx: number) => (
                <Text key={idx}>• {factor}</Text>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Recommended Actions */}
      {insights.actions && insights.actions.length > 0 && (
        <Stack space="space.100">
          <Heading as="h3">Recommended Actions</Heading>
          <Stack space="space.100">
            {insights.actions.map((action: { label: string; priority: string }, idx: number) => (
              <Stack key={idx} space="space.050">
                <Text>{action.label}</Text>
                {action.priority === 'urgent' && (
                  <Badge appearance="removed">Urgent</Badge>
                )}
              </Stack>
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

      <Text>
        Powered by LogiBrew AI | Request: {context?.extension?.request?.key || 'Unknown'}
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(<App />);

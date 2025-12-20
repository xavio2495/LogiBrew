/**
 * LogiBrew Metrics Dashboard Gadget - UI Kit Frontend
 * 
 * Displays logistics metrics including delay patterns, response times,
 * and trend forecasting for shipment disruptions.
 */

import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Stack,
  Heading,
  Text,
  Spinner,
  SectionMessage,
  BarChart,
  DynamicTable,
  Inline,
  Badge
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Call backend resolver to get metrics data
        const result = await invoke('getDashboardMetrics', {});
        setMetrics(result);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Stack space="space.200">
        <Spinner size="medium" />
        <Text>Loading logistics metrics...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <SectionMessage title="Error Loading Metrics" appearance="error">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!metrics || !metrics.data) {
    return (
      <SectionMessage title="No Data Available" appearance="info">
        <Text>No logistics data found. Metrics will appear here as shipments are processed.</Text>
      </SectionMessage>
    );
  }

  // Build delay patterns chart data
  const delayChartData = metrics.delayPatterns.map(pattern => ({
    label: pattern.cause,
    value: pattern.count
  }));

  // Build recent activities table
  const activityRows = metrics.recentActivities.map((activity, idx) => ({
    key: `activity-${idx}`,
    cells: [
      { content: activity.shipmentId },
      { content: activity.action },
      { content: new Date(activity.timestamp).toLocaleString() },
      { 
        content: activity.status === 'completed' ? (
          <Badge appearance="success">Completed</Badge>
        ) : activity.status === 'pending' ? (
          <Badge appearance="primary">Pending</Badge>
        ) : (
          <Badge appearance="removed">Failed</Badge>
        )
      }
    ]
  }));

  return (
    <Stack space="space.300">
      <Heading size="medium">LogiBrew Metrics Dashboard</Heading>

      {/* Summary Stats */}
      <Inline space="space.200">
        <Stack space="space.100">
          <Text>Total Shipments</Text>
          <Heading size="small">{metrics.summary.totalShipments}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text>Avg Response Time</Text>
          <Heading size="small">{metrics.summary.avgResponseTime}h</Heading>
        </Stack>
        <Stack space="space.100">
          <Text>Compliance Rate</Text>
          <Heading size="small">{metrics.summary.complianceRate}%</Heading>
        </Stack>
      </Inline>

      {/* Delay Patterns Chart */}
      <Stack space="space.100">
        <Heading size="small">Delay Patterns by Cause</Heading>
        <BarChart
          data={delayChartData}
          height={200}
          xLabel="Delay Cause"
          yLabel="Occurrences"
        />
      </Stack>

      {/* Recent Activities */}
      <Stack space="space.100">
        <Heading size="small">Recent Activities</Heading>
        <DynamicTable
          head={{
            cells: [
              { content: 'Shipment', isSortable: false },
              { content: 'Action', isSortable: false },
              { content: 'Timestamp', isSortable: false },
              { content: 'Status', isSortable: false }
            ]
          }}
          rows={activityRows}
          isLoading={false}
          emptyView={<Text>No recent activities</Text>}
        />
      </Stack>

      {/* 30-Day Trend Forecast */}
      {metrics.forecast && (
        <Stack space="space.100">
          <Heading size="small">30-Day Trend Forecast</Heading>
          
          <SectionMessage 
            appearance={
              metrics.forecast.predictions.some(p => p.severity === 'high') ? 'error' :
              metrics.forecast.predictions.some(p => p.severity === 'medium') ? 'warning' : 
              'information'
            }
          >
            <Stack space="space.100">
              <Text>
                Period: {metrics.forecast.period} | 
                Delay Rate: {metrics.forecast.statistics.delayRate}% | 
                Compliance: {metrics.forecast.statistics.complianceRate}%
              </Text>
              
              {metrics.forecast.topDelayCauses && metrics.forecast.topDelayCauses.length > 0 && (
                <Stack space="space.050">
                  <Text>Top Delay Causes:</Text>
                  {metrics.forecast.topDelayCauses.map((cause, idx) => (
                    <Text key={idx}>• {cause.cause}: {cause.count} occurrences</Text>
                  ))}
                </Stack>
              )}
              
              {metrics.forecast.predictions && metrics.forecast.predictions.length > 0 && (
                <Stack space="space.050">
                  <Text>Predictions:</Text>
                  {metrics.forecast.predictions.map((pred, idx) => (
                    <Inline key={idx} space="space.100" alignBlock="center">
                      <Badge appearance={
                        pred.severity === 'high' ? 'removed' :
                        pred.severity === 'medium' ? 'primary' :
                        'default'
                      }>
                        {pred.severity.toUpperCase()}
                      </Badge>
                      <Text>{pred.message}</Text>
                    </Inline>
                  ))}
                </Stack>
              )}
              
              {metrics.forecast.recommendations && metrics.forecast.recommendations.length > 0 && (
                <Stack space="space.050">
                  <Text>Recommended Actions:</Text>
                  {metrics.forecast.recommendations.map((rec, idx) => (
                    <Text key={idx}>→ {rec.description} (Priority: {rec.priority})</Text>
                  ))}
                </Stack>
              )}
            </Stack>
          </SectionMessage>
        </Stack>
      )}

      <Text appearance="subtle">
        Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * LogiBrew Knowledge Base - Global Page UI
 * 
 * Aggregates learnings from disruptions, displays best practices,
 * and provides searchable insights for logistics teams.
 * 
 * CRITICAL: This component uses ONLY @forge/react UI Kit components.
 * No standard React or HTML elements are allowed.
 */

import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Stack,
  Heading,
  Text,
  Spinner,
  SectionMessage,
  DynamicTable,
  Badge,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanel
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      try {
        console.log('[Knowledge Base] Starting data fetch...');
        // Call backend resolver to get knowledge base data
        const result = await invoke('getKnowledgeBase', {});
        console.log('[Knowledge Base] Data received:', result);
        
        if (!result) {
          throw new Error('No data returned from resolver');
        }
        
        setData(result);
        console.log('[Knowledge Base] Data set successfully');
      } catch (err: unknown) {
        console.error('[Knowledge Base] Failed to fetch knowledge base:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
        console.log('[Knowledge Base] Loading complete');
      }
    };

    fetchKnowledgeBase();
  }, [retryTrigger]);

  // Loading state with proper UI Kit components
  if (loading) {
    return (
      <Stack space="space.300">
        <Spinner size="large" />
        <Text>Loading knowledge base data...</Text>
      </Stack>
    );
  }

  // Error state with proper UI Kit components
  if (error) {
    return (
      <Stack space="space.300">
        <SectionMessage title="Error Loading Knowledge Base" appearance="error">
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

  // Null check for data - simplified
  if (!data) {
    return (
      <Stack space="space.300">
        <SectionMessage title="No Data Available" appearance="information">
          <Text>Knowledge base data is not available. Please try again later.</Text>
        </SectionMessage>
      </Stack>
    );
  }

  // Build lessons learned table rows with defensive array handling
  const lessonsRows = (data.lessons || []).map((lesson: { category: string; issue: string; resolution: string; impact: string }, idx: number) => {
    const impactBadge = lesson.impact === 'high' ? (
      <Badge appearance="removed">High</Badge>
    ) : lesson.impact === 'medium' ? (
      <Badge appearance="primary">Medium</Badge>
    ) : (
      <Badge>Low</Badge>
    );

    return {
      key: `lesson-${idx}`,
      cells: [
        { content: lesson.category || 'Unknown' },
        { content: lesson.issue || 'No description' },
        { content: lesson.resolution || 'No resolution documented' },
        { content: impactBadge }
      ]
    };
  });

  // Build best practices table rows with defensive array handling
  const practicesRows = (data.bestPractices || []).map((practice: { title: string; description: string; applicability: string }, idx: number) => ({
    key: `practice-${idx}`,
    cells: [
      { content: practice.title || 'Untitled' },
      { content: practice.description || 'No description' },
      { content: practice.applicability || 'General' }
    ]
  }));

  // Build common issues table rows with defensive array handling
  const issuesRows = (data.commonIssues || []).map((issue: { type: string; frequency: string; avgResolutionTime: string }, idx: number) => ({
    key: `issue-${idx}`,
    cells: [
      { content: issue.type || 'Unknown' },
      { content: issue.frequency || 'N/A' },
      { content: issue.avgResolutionTime || 'N/A' }
    ]
  }));

  // Main render with proper UI Kit structure
  return (
    <Stack space="space.400">
      {/* Header Section */}
      <Stack space="space.200">
        <Text>
          Aggregated learnings from disruption management, compliance validations,
          and logistics operations. Use this knowledge base to improve decision-making
          and reduce future disruptions.
        </Text>
      </Stack>

      {/* Summary Stats Cards */}
      <Stack space="space.300">
        <Stack space="space.100">
          <Text>Total Disruptions Analyzed</Text>
          <Heading as="h3">{data.summary?.totalDisruptions || 0}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text>Lessons Documented</Text>
          <Heading as="h3">{data.summary?.lessonsCount || 0}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text>Best Practices</Text>
          <Heading as="h3">{data.summary?.practicesCount || 0}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text>Avg Resolution Time</Text>
          <Heading as="h3">{data.summary?.avgResolutionHours || 0}h</Heading>
        </Stack>
      </Stack>

      {/* Tabs Component - CRITICAL: Follow exact structure */}
      <Tabs id="knowledge-tabs">
        <TabList>
          <Tab>Lessons Learned</Tab>
          <Tab>Best Practices</Tab>
          <Tab>Common Issues</Tab>
        </TabList>

        {/* Tab Panel 1: Lessons Learned */}
        <TabPanel>
          <Stack space="space.200">
            <Heading as="h3">Lessons Learned from Disruptions</Heading>
            <Text>
              Key insights from past disruptions, organized by category.
              These lessons help prevent recurring issues and improve response times.
            </Text>
            <DynamicTable
              head={{
                cells: [
                  { content: 'Category', isSortable: true },
                  { content: 'Issue', isSortable: false },
                  { content: 'Resolution', isSortable: false },
                  { content: 'Impact', isSortable: true }
                ]
              }}
              rows={lessonsRows}
              isLoading={false}
              emptyView={<Text>No lessons documented yet</Text>}
            />
          </Stack>
        </TabPanel>

        {/* Tab Panel 2: Best Practices */}
        <TabPanel>
          <Stack space="space.200">
            <Heading as="h3">Best Practices for Logistics Operations</Heading>
            <Text>
              Proven strategies and procedures for handling various logistics scenarios.
              Apply these practices to maintain compliance and efficiency.
            </Text>
            <DynamicTable
              head={{
                cells: [
                  { content: 'Practice', isSortable: true },
                  { content: 'Description', isSortable: false },
                  { content: 'Applicable To', isSortable: false }
                ]
              }}
              rows={practicesRows}
              isLoading={false}
              emptyView={<Text>No best practices documented yet</Text>}
            />
          </Stack>
        </TabPanel>

        {/* Tab Panel 3: Common Issues */}
        <TabPanel>
          <Stack space="space.200">
            <Heading as="h3">Common Issues and Patterns</Heading>
            <Text>
              Frequently encountered issues with their occurrence rates and typical resolution times.
              Use this to anticipate and prepare for common disruptions.
            </Text>
            <DynamicTable
              head={{
                cells: [
                  { content: 'Issue Type', isSortable: true },
                  { content: 'Frequency', isSortable: true },
                  { content: 'Avg Resolution Time', isSortable: true }
                ]
              }}
              rows={issuesRows}
              isLoading={false}
              emptyView={<Text>No common issues identified yet</Text>}
            />
          </Stack>
        </TabPanel>
      </Tabs>

      {/* Information Message */}
      <SectionMessage appearance="information">
        <Text>
          This knowledge base is automatically updated as new disruptions are resolved
          and logged through LogiBrew. Contribute by documenting decisions in Jira issues
          and creating verifiable logs.
        </Text>
      </SectionMessage>

      {/* Last Updated Footer */}
      <Text>
        Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
      </Text>
    </Stack>
  );
};

// Render the app using ForgeReconciler
ForgeReconciler.render(<App />);

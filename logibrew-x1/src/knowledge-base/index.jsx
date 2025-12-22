/**
 * LogiBrew Knowledge Base - Global Page UI
 * 
 * Aggregates learnings from disruptions, displays best practices,
 * and provides searchable insights for logistics teams.
 * 
 * CRITICAL: This component uses ONLY @forge/react UI Kit components.
 * No standard React or HTML elements are allowed.
 */

import ForgeReconciler, {
  useEffect,
  useState,
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

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        console.error('[Knowledge Base] Failed to fetch knowledge base:', err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
        console.log('[Knowledge Base] Loading complete');
      }
    };

    fetchKnowledgeBase();
  }, []);

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
          onClick={() => window.location.reload()}
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
        <SectionMessage title="No Data Available" appearance="info">
          <Text>Knowledge base data is not available. Please try again later.</Text>
        </SectionMessage>
      </Stack>
    );
  }

  // Build lessons learned table rows with defensive array handling
  const lessonsRows = (data.lessons || []).map((lesson, idx) => {
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
  const practicesRows = (data.bestPractices || []).map((practice, idx) => ({
    key: `practice-${idx}`,
    cells: [
      { content: practice.title || 'Untitled' },
      { content: practice.description || 'No description' },
      { content: practice.applicability || 'General' }
    ]
  }));

  // Build common issues table rows with defensive array handling
  const issuesRows = (data.commonIssues || []).map((issue, idx) => ({
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
          <Text appearance="subtle">Total Disruptions Analyzed</Text>
          <Heading size="medium">{data.summary?.totalDisruptions || 0}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text appearance="subtle">Lessons Documented</Text>
          <Heading size="medium">{data.summary?.lessonsCount || 0}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text appearance="subtle">Best Practices</Text>
          <Heading size="medium">{data.summary?.practicesCount || 0}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text appearance="subtle">Avg Resolution Time</Text>
          <Heading size="medium">{data.summary?.avgResolutionHours || 0}h</Heading>
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
            <Heading size="small">Lessons Learned from Disruptions</Heading>
            <Text appearance="subtle">
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
            <Heading size="small">Best Practices for Logistics Operations</Heading>
            <Text appearance="subtle">
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
            <Heading size="small">Common Issues and Patterns</Heading>
            <Text appearance="subtle">
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
      <Text appearance="subtle">
        Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
      </Text>
    </Stack>
  );
};

// Render the app using ForgeReconciler
ForgeReconciler.render(<App />);

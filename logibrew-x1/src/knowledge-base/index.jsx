/**
 * LogiBrew Knowledge Base - Confluence Global Page
 * 
 * Aggregates learnings from disruptions, displays best practices,
 * and provides searchable insights for logistics teams.
 */

import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Stack,
  Heading,
  Text,
  Spinner,
  SectionMessage,
  DynamicTable,
  Badge,
  Inline,
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
        const result = await invoke('getKnowledgeBase', {});
        setData(result);
      } catch (err) {
        console.error('Failed to fetch knowledge base:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeBase();
  }, []);

  if (loading) {
    return (
      <Stack space="space.300">
        <Heading size="large">LogiBrew Knowledge Base</Heading>
        <Spinner size="large" />
        <Text>Loading disruption learnings and best practices...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack space="space.300">
        <Heading size="large">LogiBrew Knowledge Base</Heading>
        <SectionMessage title="Error Loading Knowledge Base" appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
      </Stack>
    );
  }

  // Build lessons learned table
  const lessonsRows = data.lessons.map((lesson, idx) => ({
    key: `lesson-${idx}`,
    cells: [
      { content: lesson.category },
      { content: lesson.issue },
      { content: lesson.resolution },
      { 
        content: lesson.impact === 'high' ? (
          <Badge appearance="removed">High</Badge>
        ) : lesson.impact === 'medium' ? (
          <Badge appearance="primary">Medium</Badge>
        ) : (
          <Badge appearance="success">Low</Badge>
        )
      }
    ]
  }));

  // Build best practices table
  const practicesRows = data.bestPractices.map((practice, idx) => ({
    key: `practice-${idx}`,
    cells: [
      { content: practice.title },
      { content: practice.description },
      { content: practice.applicability }
    ]
  }));

  // Build common issues table
  const issuesRows = data.commonIssues.map((issue, idx) => ({
    key: `issue-${idx}`,
    cells: [
      { content: issue.type },
      { content: issue.frequency },
      { content: issue.avgResolutionTime }
    ]
  }));

  return (
    <Stack space="space.400">
      <Stack space="space.200">
        <Heading size="large">LogiBrew Knowledge Base</Heading>
        <Text>
          Aggregated learnings from disruption management, compliance validations,
          and logistics operations. Use this knowledge base to improve decision-making
          and reduce future disruptions.
        </Text>
      </Stack>

      {/* Summary Stats */}
      <Inline space="space.300">
        <Stack space="space.100">
          <Text appearance="subtle">Total Disruptions Analyzed</Text>
          <Heading size="medium">{data.summary.totalDisruptions}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text appearance="subtle">Lessons Documented</Text>
          <Heading size="medium">{data.summary.lessonsCount}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text appearance="subtle">Best Practices</Text>
          <Heading size="medium">{data.summary.practicesCount}</Heading>
        </Stack>
        <Stack space="space.100">
          <Text appearance="subtle">Avg Resolution Time</Text>
          <Heading size="medium">{data.summary.avgResolutionHours}h</Heading>
        </Stack>
      </Inline>

      <Tabs id="knowledge-tabs">
        <TabList>
          <Tab>Lessons Learned</Tab>
          <Tab>Best Practices</Tab>
          <Tab>Common Issues</Tab>
        </TabList>

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

      <SectionMessage appearance="information">
        <Text>
          This knowledge base is automatically updated as new disruptions are resolved
          and logged through LogiBrew. Contribute by documenting decisions in Jira issues
          and creating verifiable logs.
        </Text>
      </SectionMessage>

      <Text appearance="subtle">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

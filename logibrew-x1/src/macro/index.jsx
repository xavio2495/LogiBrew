/**
 * LogiBrew Verifiable Logs Macro - UI Kit Frontend
 * 
 * Displays hash-verified decision logs in Confluence pages.
 * Calls backend resolver to retrieve and verify log chains.
 */

import React, { useEffect, useState } from 'react';
import ForgeReconciler, { 
  Stack, 
  Heading, 
  Text, 
  Spinner, 
  SectionMessage,
  DynamicTable
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Call backend resolver to get log chain
        // Resolver name 'getMacroLogs' is defined in the Resolver instance in index.js
        const result = await invoke('getMacroLogs', {
          shipmentId: 'default' // TODO: Get from macro config
        });
        setLogData(result);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <Stack space="space.200">
        <Spinner size="medium" />
        <Text>Loading verifiable logs...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <SectionMessage title="Error Loading Logs" appearance="error">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!logData || logData.chainLength === 0) {
    return (
      <SectionMessage title="No Logs Found" appearance="info">
        <Text>No decision logs found for this shipment. Logs will appear here as decisions are made.</Text>
      </SectionMessage>
    );
  }

  // Build table rows from log chain
  const rows = logData.chain.map((entry, idx) => ({
    key: `log-${idx}`,
    cells: [
      { content: idx + 1 },
      { content: entry.action },
      { content: new Date(entry.timestamp).toLocaleString() },
      { content: entry.hash.substring(0, 16) + '...' }
    ]
  }));

  return (
    <Stack space="space.200">
      <Heading size="medium">
        {logData.isValid ? '✓ Verified Decision Logs' : '✗ TAMPERED LOGS DETECTED'}
      </Heading>

      {!logData.isValid && (
        <SectionMessage title="Chain Integrity Compromised" appearance="error">
          <Text>The hash chain has been tampered with. These logs cannot be trusted for audit purposes.</Text>
        </SectionMessage>
      )}

      <SectionMessage 
        title="Chain Status" 
        appearance={logData.isValid ? 'success' : 'error'}
      >
        <Text>
          Shipment: {logData.shipmentId} | 
          Entries: {logData.chainLength} | 
          Root Hash: {logData.rootHash?.substring(0, 16)}...
        </Text>
      </SectionMessage>

      <DynamicTable
        head={{
          cells: [
            { content: '#', isSortable: false },
            { content: 'Action', isSortable: false },
            { content: 'Timestamp', isSortable: false },
            { content: 'Hash', isSortable: false }
          ]
        }}
        rows={rows}
        isLoading={false}
        emptyView={<Text>No log entries</Text>}
      />
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

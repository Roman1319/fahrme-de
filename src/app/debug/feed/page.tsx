"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface DebugData {
  auth: {
    hasUser: boolean;
    userId?: string;
    authError?: string;
  };
  tableStats: Record<string, { count: number; error?: string }>;
  rpcTests: Record<string, any>;
  timestamp: string;
}

export default function DebugFeedPage() {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/feed');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch debug data');
      }
      
      setDebugData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const seedTestData = async () => {
    try {
      setSeeding(true);
      setError(null);
      
      const response = await fetch('/api/debug/seed-feed', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed test data');
      }
      
      // Обновляем данные после создания тестовых данных
      await fetchDebugData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Feed Debug</h1>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Feed Debug</h1>
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchDebugData}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Feed Debug</h1>
      
      {debugData && (
        <div className="space-y-6">
          {/* Auth Status */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Authentication</h2>
            <div className="space-y-1 text-sm">
              <div>Has User: {debugData.auth.hasUser ? '✅' : '❌'}</div>
              <div>User ID: {debugData.auth.userId || 'N/A'}</div>
              {debugData.auth.authError && (
                <div className="text-red-600">Error: {debugData.auth.authError}</div>
              )}
            </div>
          </div>

          {/* Table Stats */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Table Statistics</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(debugData.tableStats).map(([table, stats]) => (
                <div key={table} className="flex justify-between">
                  <span className="font-mono">{table}:</span>
                  <span className={stats.error ? 'text-red-600' : 'text-green-600'}>
                    {stats.error ? `Error: ${stats.error}` : stats.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RPC Tests */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">RPC Function Tests</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(debugData.rpcTests).map(([rpc, result]) => (
                <div key={rpc} className="border-b border-gray-300 dark:border-gray-600 pb-2">
                  <div className="font-mono font-semibold">{rpc}:</div>
                  <div className="ml-4 space-y-1">
                    <div>Success: {result.success ? '✅' : '❌'}</div>
                    {result.dataCount !== undefined && (
                      <div>Data Count: {result.dataCount}</div>
                    )}
                    {result.error && (
                      <div className="text-red-600">Error: {result.error}</div>
                    )}
                    {result.code && (
                      <div className="text-orange-600">Code: {result.code}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            Last updated: {new Date(debugData.timestamp).toLocaleString()}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={fetchDebugData}
              className="btn-primary"
            >
              Refresh
            </button>
            <button 
              onClick={seedTestData}
              disabled={seeding}
              className="btn-secondary"
            >
              {seeding ? 'Creating...' : 'Seed Test Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

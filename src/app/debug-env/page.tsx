"use client";

import { useState } from 'react';
// Migration functions removed - migration is complete
import { getCarDataStats } from '@/lib/car-brands';

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_AUTH_BACKEND: process.env.NEXT_PUBLIC_AUTH_BACKEND,
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Debug Environment</h1>
        
        <EnvironmentPanel envVars={envVars} />
        <CarDataStatsPanel />
        <MigrationPanel />
      </div>
    </div>
  );
}

function EnvironmentPanel({ envVars }: { envVars: Record<string, string | undefined> }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
      <div className="space-y-2">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="font-mono text-sm">{key}</span>
            <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
              {value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'Not set'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarDataStatsPanel() {
  const [stats, setStats] = useState<{ totalBrands: number; totalModels: number; brandsWithModels: number; } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await getCarDataStats();
      setStats(result);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Car Data Statistics</h2>
      <div className="space-y-4">
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Stats'}
        </button>
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.totalBrands}</div>
              <div className="text-sm text-blue-600 dark:text-blue-300">Total Brands</div>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.totalModels}</div>
              <div className="text-sm text-green-600 dark:text-green-300">Total Models</div>
            </div>
            <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded">
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats.brandsWithModels}</div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Brands with Models</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MigrationPanel() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Migration Status</h2>
      <div className="space-y-4">
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200">✅ Migration Complete!</h3>
          <p className="text-green-700 dark:text-green-300 mt-2">
            All data has been successfully migrated to Supabase. The project now uses:
          </p>
          <ul className="list-disc list-inside mt-2 text-green-700 dark:text-green-300">
            <li>Supabase for authentication</li>
            <li>Supabase for car data (brands & models)</li>
            <li>Supabase for user cars and photos</li>
            <li>Supabase for logbook entries and comments</li>
            <li>Supabase for likes and interactions</li>
            <li>Supabase for user profiles</li>
          </ul>
        </div>
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">📊 Current Status</h3>
          <p className="text-blue-700 dark:text-blue-300 mt-2">
            The application is now fully migrated and ready for production use.
            All localStorage dependencies have been removed except for UI caching.
          </p>
        </div>
      </div>
    </div>
  );
}
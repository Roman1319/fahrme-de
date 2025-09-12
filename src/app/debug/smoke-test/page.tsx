"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import * as N from '@/lib/notifications';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: Record<string, unknown>;
}

export default function SmokeTestPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Authentication', status: 'pending' },
    { name: 'Storage Images', status: 'pending' },
    { name: 'Notifications Module', status: 'pending' },
    { name: 'Feed Data', status: 'pending' },
    { name: 'Server Session', status: 'pending' },
    { name: 'Realtime Notifications', status: 'pending' }
  ]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message?: string, details?: Record<string, unknown>) => {
    setTests(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, details }
        : test
    ));
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    updateTest(testName, 'running');
    try {
      await testFn();
      updateTest(testName, 'passed');
    } catch (error) {
      updateTest(testName, 'failed', 
        error instanceof Error ? error.message : String(error),
        error
      );
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', message: undefined, details: undefined })));

    // Test 1: Authentication
    await runTest('Authentication', async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      if (!user.id) {
        throw new Error('User ID not available');
      }
    });

    // Test 2: Storage Images
    await runTest('Storage Images', async () => {
      // Test placeholder image exists
      const response = await fetch('/placeholder-avatar.jpg');
      if (!response.ok) {
        throw new Error(`Placeholder image not found: ${response.status}`);
      }
      
      // Test StorageImage component can be imported
      const { StorageImage } = await import('@/components/ui/StorageImage');
      if (!StorageImage) {
        throw new Error('StorageImage component not exported');
      }
    });

    // Test 3: Notifications Module
    await runTest('Notifications Module', async () => {
      if (!user) return;
      
      // Test notifications module functions exist
      if (typeof N.list !== 'function') {
        throw new Error('N.list function not available');
      }
      if (typeof N.unreadCount !== 'function') {
        throw new Error('N.unreadCount function not available');
      }
      if (typeof N.subscribe !== 'function') {
        throw new Error('N.subscribe function not available');
      }
      
      // Test basic functionality
      const notifications = await N.list(user.id);
      const unreadCount = await N.unreadCount(user.id);
      
      if (!Array.isArray(notifications)) {
        throw new Error('N.list did not return an array');
      }
      if (typeof unreadCount !== 'number') {
        throw new Error('N.unreadCount did not return a number');
      }
    });

    // Test 4: Feed Data
    await runTest('Feed Data', async () => {
      const response = await fetch('/api/debug/feed');
      if (!response.ok) {
        throw new Error(`Feed debug API failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.tableStats) {
        throw new Error('Feed debug API did not return table stats');
      }
      
      // Check if RPC functions are working
      if (data.rpcTests?.feed_explore?.success !== true) {
        throw new Error('feed_explore RPC function not working');
      }
    });

    // Test 5: Server Session
    await runTest('Server Session', async () => {
      const response = await fetch('/api/cars/route');
      if (!response.ok) {
        throw new Error(`Cars API failed: ${response.status}`);
      }
      
      // The API should return data even if empty
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Cars API did not return an array');
      }
    });

    // Test 6: Realtime Notifications
    await runTest('Realtime Notifications', async () => {
      if (!user) return;
      
      // Test subscription setup
      let callbackCalled = false;
      const unsubscribe = N.subscribe(user.id, () => {
        callbackCalled = true;
      });
      
      // Wait a bit to see if subscription works
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clean up
      unsubscribe();
      
      // For now, just test that subscription doesn't throw
      // In a real test, we'd create a notification and check if callback is called
    });

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'passed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const allTestsPassed = tests.every(test => test.status === 'passed');
  const anyTestsFailed = tests.some(test => test.status === 'failed');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Smoke Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={running}
          className="btn-primary"
        >
          {running ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>Total: {tests.length}</div>
          <div className="text-green-500">Passed: {tests.filter(t => t.status === 'passed').length}</div>
          <div className="text-red-500">Failed: {tests.filter(t => t.status === 'failed').length}</div>
        </div>
        
        {allTestsPassed && (
          <div className="mt-2 text-green-600 dark:text-green-400 font-semibold">
            🎉 All tests passed! System is ready.
          </div>
        )}
        
        {anyTestsFailed && (
          <div className="mt-2 text-red-600 dark:text-red-400 font-semibold">
            ⚠️ Some tests failed. Check details below.
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-2">
        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              test.status === 'passed' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                : test.status === 'failed'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                : test.status === 'running'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getStatusIcon(test.status)}</span>
                <span className="font-medium">{test.name}</span>
              </div>
              <span className={`text-sm ${getStatusColor(test.status)}`}>
                {test.status.toUpperCase()}
              </span>
            </div>
            
            {test.message && (
              <div className="mt-2 text-sm">
                <div className="font-medium">Message:</div>
                <div className="text-gray-600 dark:text-gray-400">{test.message}</div>
              </div>
            )}
            
            {test.details && (
              <div className="mt-2 text-sm">
                <div className="font-medium">Details:</div>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mt-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <a href="/debug/feed" className="text-blue-600 dark:text-blue-400 hover:underline">
            Feed Debug
          </a>
          <a href="/debug/notifications" className="text-blue-600 dark:text-blue-400 hover:underline">
            Notifications Debug
          </a>
          <a href="/feed" className="text-blue-600 dark:text-blue-400 hover:underline">
            Feed Page
          </a>
          <a href="/explore" className="text-blue-600 dark:text-blue-400 hover:underline">
            Explore Page
          </a>
        </div>
      </div>
    </div>
  );
}

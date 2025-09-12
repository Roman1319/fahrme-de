'use client';

import { useState } from 'react';
import { validateMileageUnit, normalizeMileageUnit, getMileageUnitLabel } from '@/lib/validation';

export default function TestMileageValidationPage() {
  const [testValue, setTestValue] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [normalizedValue, setNormalizedValue] = useState('');

  const handleTest = () => {
    const result = validateMileageUnit(testValue);
    setValidationResult(result);
    setNormalizedValue(normalizeMileageUnit(testValue));
  };

  const testCases = [
    { input: 'km', expected: 'valid' },
    { input: 'mi', expected: 'valid' },
    { input: 'miles', expected: 'invalid' },
    { input: 'kilometers', expected: 'invalid' },
    { input: 'KM', expected: 'invalid' },
    { input: 'MI', expected: 'invalid' },
    { input: '', expected: 'invalid' },
    { input: '123', expected: 'invalid' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mileage Unit Validation Test</h1>
      
      {/* Interactive Test */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Interactive Test</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Enter mileage unit to test:
            </label>
            <input
              type="text"
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder="e.g., km, mi, miles"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Test
          </button>
        </div>
        
        {validationResult && (
          <div className="mt-4">
            <div className={`p-3 rounded-md ${
              validationResult.valid 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              <strong>Result:</strong> {validationResult.valid ? 'Valid' : 'Invalid'}
              {validationResult.error && (
                <div className="mt-1">
                  <strong>Error:</strong> {validationResult.error}
                </div>
              )}
            </div>
            {normalizedValue && normalizedValue !== testValue && (
              <div className="mt-2 p-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-md">
                <strong>Normalized:</strong> "{testValue}" → "{normalizedValue}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Cases */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Input</th>
                <th className="text-left p-2">Expected</th>
                <th className="text-left p-2">Actual</th>
                <th className="text-left p-2">Normalized</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((testCase, index) => {
                const result = validateMileageUnit(testCase.input);
                const normalized = normalizeMileageUnit(testCase.input);
                const passed = (testCase.expected === 'valid') === result.valid;
                
                return (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-mono">"{testCase.input}"</td>
                    <td className="p-2">{testCase.expected}</td>
                    <td className="p-2">{result.valid ? 'valid' : 'invalid'}</td>
                    <td className="p-2 font-mono">"{normalized}"</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        passed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Test */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">API Test</h2>
        <p className="mb-4">
          Test the actual API endpoint with different mileage_unit values:
        </p>
        <div className="space-y-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/logbook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    car_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
                    title: 'Test Post',
                    content: 'Test content',
                    mileage: 1000,
                    mileage_unit: 'mi'
                  })
                });
                const result = await response.json();
                console.log('API Test (mi):', result);
                alert(`API Test (mi): ${response.status} - ${JSON.stringify(result)}`);
              } catch (error) {
                console.error('API Test (mi) error:', error);
                alert(`API Test (mi) error: ${error}`);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2"
          >
            Test API with "mi"
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/logbook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    car_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
                    title: 'Test Post',
                    content: 'Test content',
                    mileage: 1000,
                    mileage_unit: 'miles' // This should fail
                  })
                });
                const result = await response.json();
                console.log('API Test (miles):', result);
                alert(`API Test (miles): ${response.status} - ${JSON.stringify(result)}`);
              } catch (error) {
                console.error('API Test (miles) error:', error);
                alert(`API Test (miles) error: ${error}`);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Test API with "miles" (should fail)
          </button>
        </div>
      </div>
    </div>
  );
}

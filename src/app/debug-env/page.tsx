"use client";

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_AUTH_BACKEND: process.env.NEXT_PUBLIC_AUTH_BACKEND,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Environment Variables Debug</h1>
        
        <div className="space-y-4">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
              <h3 className="font-semibold text-lg mb-2">{key}:</h3>
              <div className="space-y-2">
                <p><strong>Value:</strong> {value || 'NOT SET'}</p>
                <p><strong>Length:</strong> {value?.length || 0}</p>
                <p><strong>Has spaces:</strong> {value?.includes(' ') ? 'YES' : 'NO'}</p>
                <p><strong>Starts with space:</strong> {value?.startsWith(' ') ? 'YES' : 'NO'}</p>
                <p><strong>Ends with space:</strong> {value?.endsWith(' ') ? 'YES' : 'NO'}</p>
                {value && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Raw value (click to expand)</summary>
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs overflow-auto">
                      {JSON.stringify(value)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <h3 className="font-semibold text-lg mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check if NEXT_PUBLIC_SUPABASE_URL has any spaces</li>
              <li>Check if NEXT_PUBLIC_SUPABASE_ANON_KEY is complete</li>
              <li>Make sure NEXT_PUBLIC_AUTH_BACKEND is set to &apos;supabase&apos;</li>
              <li>If there are spaces, remove them from .env.local</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

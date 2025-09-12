'use client';
import { useState, useEffect } from 'react';

export default function EnvTestPage() {
  const [envVars, setEnvVars] = useState<Record<string, any>>({});

  useEffect(() => {
    setEnvVars({
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      'NODE_ENV': process.env.NODE_ENV,
    });
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест переменных окружения</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Переменные окружения:</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <h3 className="font-semibold">Статус:</h3>
          <p>SUPABASE_URL: {envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ Настроен' : '❌ Не настроен'}</p>
          <p>SUPABASE_ANON_KEY: {envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'Set' ? '✅ Настроен' : '❌ Не настроен'}</p>
        </div>
      </div>
    </div>
  );
}

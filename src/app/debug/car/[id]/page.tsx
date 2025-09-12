'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getCar } from '@/lib/cars';
import { supabase } from '@/lib/supabaseClient';

export default function DebugCarPage() {
  const params = useParams();
  const carId = params.id as string;
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    console.log('[DebugCarPage] Loading car with ID:', carId);
    
    // Check auth first
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      console.log('[DebugCarPage] Auth check:', { user, authError });
      setAuthUser(user);
      
      if (authError) {
        console.error('[DebugCarPage] Auth error:', authError);
        setError('Auth error: ' + authError.message);
        setLoading(false);
        return;
      }
      
      // Try to get car directly from Supabase
      supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single()
        .then(({ data, error: carError }) => {
          console.log('[DebugCarPage] Direct Supabase query:', { data, carError });
          
          if (carError) {
            console.error('[DebugCarPage] Car query error:', carError);
            setError('Car query error: ' + carError.message);
          } else {
            setCar(data);
          }
          
          setLoading(false);
        });
    });
  }, [carId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Car Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Car ID:</h2>
          <p className="font-mono">{carId}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Auth User:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(authUser, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Car Data:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(car, null, 2)}
          </pre>
        </div>
        
        {error && (
          <div>
            <h2 className="text-lg font-semibold text-red-600">Error:</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

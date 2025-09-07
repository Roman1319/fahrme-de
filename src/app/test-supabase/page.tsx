"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestSupabasePage() {
  const [status, setStatus] = useState("Checking...");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      setStatus("Checking Supabase connection...");
      setError(null);
      
      console.log('[test] Starting connection test...');
      
      // First, let's check if we can reach Supabase at all
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[test] Session check result:', { session: !!session, error: sessionError });
      
      if (sessionError) {
        setError(`Session error: ${sessionError.message}`);
        setStatus("❌ Session error");
        return;
      }

      // Try to get user info
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('[test] User check result:', { user: !!user, error: userError });

      if (userError) {
        setError(`User error: ${userError.message}`);
        setStatus("❌ User error");
        return;
      }

      if (session?.user || user) {
        setUser(session?.user || user);
        setStatus("✅ Connected and user is signed in");
      } else {
        setStatus("✅ Connected but no user signed in");
      }
    } catch (err) {
      console.error('[test] Connection error:', err);
      setError(`Connection error: ${err}`);
      setStatus("❌ Connection failed");
    }
  };

  const testLogin = async () => {
    try {
      setStatus("Testing login...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "dyatchinr@gmail.com",
        password: "123456"
      });

      if (error) {
        setError(`Login error: ${error.message}`);
        setStatus("Login failed");
      } else {
        setUser(data.user);
        setStatus("✅ Login successful!");
      }
    } catch (err) {
      setError(`Login error: ${err}`);
      setStatus("Login failed");
    }
  };

  const testRegister = async () => {
    try {
      setStatus("Testing registration...");
      const { error } = await supabase.auth.signUp({
        email: "test@example.com",
        password: "123456"
      });

      if (error) {
        setError(`Registration error: ${error.message}`);
        setStatus("Registration failed");
      } else {
        setStatus("✅ Registration successful! Check your email for confirmation.");
      }
    } catch (err) {
      setError(`Registration error: ${err}`);
      setStatus("Registration failed");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setStatus("✅ Signed out successfully");
    } catch (err) {
      setError(`Sign out error: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h2 className="text-xl font-semibold mb-2">Status:</h2>
            <p className="text-lg">{status}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded">
              <h3 className="font-semibold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {user && (
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded">
              <h3 className="font-semibold">Current User:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={checkSupabaseConnection} className="btn-primary">
              Check Connection
            </button>
            <button onClick={testLogin} className="btn-secondary">
              Test Login
            </button>
            <button onClick={testRegister} className="btn-secondary">
              Test Register
            </button>
            {user && (
              <button onClick={signOut} className="btn-secondary">
                Sign Out
              </button>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Environment Variables:</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm">
              <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p>NEXT_PUBLIC_AUTH_BACKEND: {process.env.NEXT_PUBLIC_AUTH_BACKEND || 'local'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

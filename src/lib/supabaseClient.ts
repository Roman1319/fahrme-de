import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// Fix common issues with environment variables
if (supabaseUrl && supabaseUrl.startsWith(' ')) {
  console.warn('[supabase] URL starts with space, fixing...');
  supabaseUrl = supabaseUrl.trim();
}

if (supabaseAnonKey && supabaseAnonKey.startsWith(' ')) {
  console.warn('[supabase] Key starts with space, fixing...');
  supabaseAnonKey = supabaseAnonKey.trim();
}

console.log('[supabase] URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('[supabase] Key:', supabaseAnonKey ? 'Set' : 'Missing')
console.log('[supabase] URL value:', JSON.stringify(supabaseUrl))
console.log('[supabase] Key value:', JSON.stringify(supabaseAnonKey))

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Must start with https://`)
}

// Validate key format (should be a JWT)
if (!supabaseAnonKey.startsWith('eyJ')) {
  throw new Error(`Invalid Supabase key format: ${supabaseAnonKey.substring(0, 20)}... Must be a JWT token`)
}

// Singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'fahrme-de'
    }
  }
})

// Global auth state listener
if (typeof window !== 'undefined') {
  console.log('[supabase] Setting up global auth listener...');
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[supabase] Global auth state changed:', event, session?.user?.id);
    
    // Notify all auth services about the change
    if (window.authStateChangeCallbacks) {
      window.authStateChangeCallbacks.forEach(callback => {
        try {
          // For Supabase, we need to pass the session user directly
          // The SupabaseAuthService will handle the conversion
          callback(session?.user || null);
        } catch (error) {
          console.error('[supabase] Error in auth callback:', error);
        }
      });
    }
  });
}

// Global callback system for auth state changes
declare global {
  interface Window {
    authStateChangeCallbacks: Set<(user: any) => void>;
  }
}

if (typeof window !== 'undefined') {
  window.authStateChangeCallbacks = new Set();
}

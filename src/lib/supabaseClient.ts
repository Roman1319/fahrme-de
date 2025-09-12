
import { createClient } from '@supabase/supabase-js'
import { validateSupabaseEnv, createSupabaseConfig } from './env-validation'
import { logger } from './logger'

// Временное решение: хардкод значений для отладки
const supabaseUrl = 'https://wezpfrbhhgclvdbddivf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlenBmcmJoaGdjbHZkYmRkaXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzA3NDYsImV4cCI6MjA3MjgwNjc0Nn0.Wpg-0AxesiDVyUNHkT2qn8WCxpv2Wte8MQuLoHSRqGk'

logger.debug('[supabase] Using hardcoded values for debugging')
logger.debug('[supabase] URL:', supabaseUrl)
logger.debug('[supabase] Key:', supabaseAnonKey ? 'Set' : 'Missing')

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

// Global auth state management
let globalAuthReady = false;
let globalUser: { id: string; email?: string; user_metadata?: { name?: string; handle?: string } } | null = null;
let authCallbacks: Set<(user: { id: string; email?: string; user_metadata?: { name?: string; handle?: string } } | null, ready: boolean) => void> = new Set();

// Export global auth state
export const getAuthReady = () => globalAuthReady;
export const getGlobalUser = () => globalUser;

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: { id: string; email?: string; user_metadata?: { name?: string; handle?: string } } | null, ready: boolean) => void) => {
  authCallbacks.add(callback);
  
  // Immediately call with current state
  callback(globalUser, globalAuthReady);
  
  return () => {
    authCallbacks.delete(callback);
  };
};

// Global auth state listener - единственный слушатель в приложении
if (typeof window !== 'undefined') {
  logger.debug('[supabase] Setting up unified global auth listener...');
  
  // Initialize auth state
  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        logger.error('[supabase] Error getting initial session:', error);
      } else if (session?.user) {
        globalUser = session.user;
        logger.info('[supabase] User loaded from session:', session.user.email, 'ID:', session.user.id);
      }
      globalAuthReady = true;
      logger.debug('[supabase] AuthReady set to true');
      
      // Notify all callbacks
      authCallbacks.forEach(callback => {
        try {
          callback(globalUser, globalAuthReady);
        } catch (error) {
          logger.error('[supabase] Error in auth callback:', error);
        }
      });
    } catch (error) {
      logger.error('[supabase] Error initializing auth:', error);
      globalAuthReady = true;
      authCallbacks.forEach(callback => {
        try {
          callback(globalUser, globalAuthReady);
        } catch (error) {
          logger.error('[supabase] Error in auth callback:', error);
        }
      });
    }
  };
  
  initializeAuth();
  
  // Listen to auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    logger.debug('[supabase] Auth state changed:', event, session?.user?.id);
    
    globalUser = session?.user || null;
    globalAuthReady = true;
    
    logger.debug('[supabase] Notifying', authCallbacks.size, 'callbacks');
    authCallbacks.forEach(callback => {
      try {
        callback(globalUser, globalAuthReady);
      } catch (error) {
        console.error('[supabase] Error in auth callback:', error);
      }
    });
  });
}

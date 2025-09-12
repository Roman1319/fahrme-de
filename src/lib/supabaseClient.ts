
import { createClient } from '@supabase/supabase-js'
import { validateSupabaseEnv, createSupabaseConfig } from './env-validation'

// Валидация переменных окружения
const validation = validateSupabaseEnv()

if (!validation.isValid) {
  console.error('[supabase] Environment validation failed:')
  validation.errors.forEach(error => console.error(`[supabase] ❌ ${error}`))
  throw new Error('Supabase environment validation failed')
}

if (validation.warnings.length > 0) {
  console.warn('[supabase] Environment warnings:')
  validation.warnings.forEach(warning => console.warn(`[supabase] ⚠️  ${warning}`))
}

// Создание конфигурации с валидацией
const config = createSupabaseConfig(false) // anon client
const supabaseUrl = config.url
const supabaseAnonKey = config.anonKey

console.log('[supabase] URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('[supabase] Key:', supabaseAnonKey ? 'Set' : 'Missing')

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
  console.log('[supabase] Setting up unified global auth listener...');
  
  // Initialize auth state
  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[supabase] Error getting initial session:', error);
      } else if (session?.user) {
        globalUser = session.user;
        console.info('[supabase] User loaded from session:', session.user.email, 'ID:', session.user.id);
      }
      globalAuthReady = true;
      console.info('[supabase] AuthReady set to true');
      
      // Notify all callbacks
      authCallbacks.forEach(callback => {
        try {
          callback(globalUser, globalAuthReady);
        } catch (error) {
          console.error('[supabase] Error in auth callback:', error);
        }
      });
    } catch (error) {
      console.error('[supabase] Error initializing auth:', error);
      globalAuthReady = true;
      authCallbacks.forEach(callback => {
        try {
          callback(globalUser, globalAuthReady);
        } catch (error) {
          console.error('[supabase] Error in auth callback:', error);
        }
      });
    }
  };
  
  initializeAuth();
  
  // Listen to auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[supabase] Auth state changed:', event, session?.user?.id);
    
    globalUser = session?.user || null;
    globalAuthReady = true;
    
    console.log('[supabase] Notifying', authCallbacks.size, 'callbacks');
    authCallbacks.forEach(callback => {
      try {
        callback(globalUser, globalAuthReady);
      } catch (error) {
        console.error('[supabase] Error in auth callback:', error);
      }
    });
  });
}

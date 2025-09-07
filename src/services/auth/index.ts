// Authentication service factory
// Switches between Local and Supabase implementations based on environment

import { AuthService } from './types';
import { LocalAuthService } from './local';
import { SupabaseAuthService } from './supabase';

// Environment variable to switch auth backend
const AUTH_BACKEND = process.env.NEXT_PUBLIC_AUTH_BACKEND || 'local';

// Force local auth if Supabase is not configured
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const effectiveAuthBackend = (AUTH_BACKEND === 'supabase' && isSupabaseConfigured) ? 'supabase' : 'local';

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (authServiceInstance) {
    return authServiceInstance;
  }

  switch (effectiveAuthBackend) {
    case 'supabase':
      console.info('[auth] Using Supabase authentication backend');
      authServiceInstance = new SupabaseAuthService();
      break;
    case 'local':
    default:
      console.info('[auth] Using Local authentication backend');
      authServiceInstance = new LocalAuthService();
      break;
  }

  return authServiceInstance;
}

// Export types for convenience
export type { User, Session, LoginCredentials, RegisterCredentials, AuthResult, AuthStateChangeCallback } from './types';
export type { AuthService } from './types';

"use client";

import { 
  AuthService, 
  User, 
  Session, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResult, 
  AuthStateChangeCallback 
} from './types';
import { supabase } from '@/lib/supabaseClient';
import { readProfile } from '@/lib/profile';

// AuthUser type for Supabase integration
export type AuthUser = {
  id: string;
  email: string;
  handle?: string;
  name?: string;
  avatarUrl?: string;
};

export class SupabaseAuthService implements AuthService {
  private listeners: Set<AuthStateChangeCallback> = new Set();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    // Don't set up listener here - it's already set up in supabaseClient.ts
    // We'll just set up the callback system
    console.log('[supabase-auth] Auth listener setup skipped - using global listener');
  }

  private async createProfileIfNotExists(userId: string, email: string, name?: string, handle?: string): Promise<AuthUser> {
    // For now, just return basic user info without creating profile
    // This avoids RLS issues until we set up the profiles table properly
    return {
      id: userId,
      email: email,
      handle: handle || email.split('@')[0],
      name: name || email.split('@')[0],
      avatarUrl: undefined
    };
  }

  private async migrateLocalProfileIfNeeded(userId: string, supabaseProfile: { name?: string; avatar_url?: string }): Promise<void> {
    // Skip migration for now to avoid RLS issues
    // This will be re-enabled once we set up the profiles table properly
    console.info('[supabase-auth] Profile migration skipped - profiles table not set up yet');
  }

  private convertAuthUserToUser(authUser: AuthUser): User {
    return {
      id: authUser.id,
      name: authUser.name || authUser.handle || authUser.email,
      email: authUser.email,
      password: '', // Supabase handles passwords
      createdAt: Date.now() // We don't have this from Supabase, using current time
    };
  }

  // Core operations
  getCurrentUser(): User | null {
    // For Supabase, we can't get session synchronously
    // Return null and rely on onAuthStateChanged for real-time updates
    return null;
  }

  private async getCurrentUserAsync(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('[supabase-auth] No authenticated user');
        return null;
      }

      const authUser = await this.createProfileIfNotExists(user.id, user.email || '');
      return this.convertAuthUserToUser(authUser);
    } catch (error) {
      console.error('[supabase-auth] Error getting current user:', error);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('[supabase-auth] Login error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' };
      }

      const user = await this.getCurrentUserAsync();
      return { success: true, user: user || undefined };
    } catch (error) {
      console.error('[supabase-auth] Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('[supabase-auth] Register error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed' };
      }

      // If email confirmation is disabled, user is immediately signed in
      if (data.session) {
        const user = await this.getCurrentUserAsync();
        return { success: true, user: user || undefined };
      } else {
        // Email confirmation required
        return { success: true, error: 'Please check your email to confirm your account' };
      }
    } catch (error) {
      console.error('[supabase-auth] Register error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[supabase-auth] Logout error:', error);
      }
      
      // Очищаем только временные данные пользователя из localStorage
      // Автомобили пользователя должны сохраняться
      if (typeof window !== 'undefined') {
        try {
          // Очищаем только временные данные пользователя
          localStorage.removeItem('mainVehicle');
          localStorage.removeItem('userProfile');
          
          console.info('[supabase-auth] Temporary user data cleared from localStorage (cars preserved)');
        } catch (error) {
          console.error('[supabase-auth] Error clearing temporary user data:', error);
        }
      }
      
      this.notifyListeners(null);
    } catch (error) {
      console.error('[supabase-auth] Logout error:', error);
    }
  }

  // Session management
  getSession(): Session | null {
    // For Supabase, we can't get session synchronously
    // Return null and rely on onAuthStateChanged for real-time updates
    return null;
  }

  setSession(session: Session): void {
    // Supabase manages sessions automatically
    console.warn('[supabase-auth] setSession not supported in Supabase mode');
  }

  clearSession(): void {
    // Supabase manages sessions automatically
    console.warn('[supabase-auth] clearSession not supported in Supabase mode');
  }

  // User management
  getUsers(): User[] {
    // Supabase doesn't support getting all users from client
    // Return empty array silently - this method is only used for local auth compatibility
    return [];
  }

  saveUsers(_users: User[]): void {
    // Supabase manages users on server
    console.warn('[supabase-auth] saveUsers not supported in Supabase mode');
  }

  // Event handling
  onAuthStateChanged(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Also add to global callback system with conversion
    if (typeof window !== 'undefined' && window.authStateChangeCallbacks) {
      const convertedCallback = async (supabaseUser: any) => {
        if (supabaseUser) {
          try {
            // Convert Supabase user to our User format
            const authUser = await this.createProfileIfNotExists(
              supabaseUser.id, 
              supabaseUser.email || '', 
              supabaseUser.user_metadata?.name,
              supabaseUser.user_metadata?.handle
            );
            const user = this.convertAuthUserToUser(authUser);
            callback(user);
          } catch (error) {
            console.error('[supabase-auth] Error converting user:', error);
            callback(null);
          }
        } else {
          callback(null);
        }
      };
      
      window.authStateChangeCallbacks.add(convertedCallback);
      
      return () => {
        this.listeners.delete(callback);
        if (typeof window !== 'undefined' && window.authStateChangeCallbacks) {
          window.authStateChangeCallbacks.delete(convertedCallback);
        }
      };
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Utilities
  isAuthenticated(): boolean {
    // For Supabase, we can't check auth state synchronously
    // Return false and rely on onAuthStateChanged for real-time updates
    return false;
  }

  isGuest(): boolean {
    return !this.isAuthenticated();
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

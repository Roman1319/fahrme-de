"use client";

// Define types inline since types.ts doesn't exist
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: number;
}

export interface Session {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export type AuthStateChangeCallback = (user: User | null) => void;

export interface AuthService {
  getCurrentUser(): User | null;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(credentials: RegisterCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Session | null;
  setSession(): void;
  clearSession(): void;
  getUsers(): User[];
  saveUsers(): void;
  onAuthStateChanged(callback: AuthStateChangeCallback): () => void;
}
import { supabase } from '@/lib/supabaseClient';
// Profile functionality moved to Supabase

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

  // 1) помощник: дождаться сессии — иначе запрос уйдёт как anon
  private async waitForSession(maxMs = 4000): Promise<unknown | null> {
    console.log('[supabase-auth] Waiting for session...');
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const { data, error } = await supabase.auth.getSession();
      console.log('[supabase-auth] Session check:', { 
        hasSession: !!data?.session, 
        hasToken: !!data?.session?.access_token,
        error: error?.message 
      });
      if (data?.session?.access_token) {
        console.log('[supabase-auth] Session found!');
        return data.session;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    console.error('[supabase-auth] No session found after', maxMs, 'ms');
    throw new Error('No session yet');
  }

  // 2) создание профиля: только существующие поля, без .select()
  private async createProfileIfNotExists(userId: string, email: string): Promise<AuthUser> {
    console.log('[supabase-auth] Creating profile for user:', userId, 'email:', email);
    try {
      await this.waitForSession(); // <<< критично: ждём JWT

      console.log('[supabase-auth] Attempting to upsert profile...');
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, display_name: null, avatar_url: null },
          { onConflict: 'id' } // UPSERT - если есть, обновит, если нет - создаст
        ); // без .select() — иначе нужен SELECT и полезут 406/400

      if (error) {
        // Если это ошибка дубликата - это нормально, профиль уже существует
        if (error.code === '23505' && error.message.includes('duplicate key value violates unique constraint')) {
          console.log('[supabase-auth] Profile already exists, continuing...');
        } else {
          console.error('[supabase-auth] Error creating profile:');
          console.error('Raw error object:', error);
          console.error('Error type:', typeof error);
          console.error('Error keys:', Object.keys(error));
          console.error('Error stringified:', JSON.stringify(error, null, 2));
          console.error('Error details:', {
            code: (error as Error & { code?: string })?.code,
            message: (error as Error)?.message,
            details: (error as Error & { details?: string })?.details,
            hint: (error as Error & { hint?: string })?.hint,
            status: (error as Error & { status?: number })?.status,
            statusText: (error as Error & { statusText?: string })?.statusText,
          });
          throw error;
        }
      }

      console.log('[supabase-auth] Profile created successfully!');
      return {
        id: userId,
        email: email,
        handle: email.split('@')[0],
        name: email.split('@')[0],
        avatarUrl: undefined
      };
    } catch (e) {
      console.error('[supabase-auth] Error in createProfileIfNotExists:');
      console.error('Raw error object:', e);
      console.error('Error type:', typeof e);
      console.error('Error stringified:', JSON.stringify(e, null, 2));
      console.error('Error stack:', (e as Error)?.stack);
      return {
        id: userId,
        email: email,
        handle: email.split('@')[0],
        name: email.split('@')[0],
        avatarUrl: undefined
      }; // не блокируем UX
    }
  }

  private async migrateLocalProfileIfNeeded(): Promise<void> {
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
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
          return { success: false, error: 'Ungültige E-Mail-Adresse oder Passwort. Bitte überprüfen Sie Ihre Eingaben.' };
        }
        
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse, bevor Sie sich anmelden.' };
        }
        
        if (error.message.includes('Too many requests')) {
          return { success: false, error: 'Zu viele Anmeldeversuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.' };
        }
        
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Anmeldung fehlgeschlagen' };
      }

      const user = await this.getCurrentUserAsync();
      return { success: true, user: user || undefined };
    } catch (error) {
      console.error('[supabase-auth] Login error:', error);
      return { success: false, error: 'Anmeldung fehlgeschlagen' };
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
        
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          return { success: false, error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail-Adresse.' };
        }
        
        if (error.message.includes('Invalid email')) {
          return { success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
        }
        
        if (error.message.includes('Password should be at least')) {
          return { success: false, error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' };
        }
        
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Registrierung fehlgeschlagen' };
      }

      // If email confirmation is disabled, user is immediately signed in
      if (data.session) {
        const user = await this.getCurrentUserAsync();
        return { success: true, user: user || undefined };
      } else {
        // Email confirmation required
        return { success: true, error: 'Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen' };
      }
    } catch (error) {
      console.error('[supabase-auth] Register error:', error);
      return { success: false, error: 'Registrierung fehlgeschlagen' };
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
          localStorage.removeItem('mainVehicle'); // legacy
          localStorage.removeItem('fahrme:mainVehicle'); // new
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

  setSession(): void {
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

  saveUsers(): void {
    // Supabase manages users on server
    console.warn('[supabase-auth] saveUsers not supported in Supabase mode');
  }

  // Event handling
  onAuthStateChanged(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Also add to global callback system with conversion
    if (typeof window !== 'undefined' && window.authStateChangeCallbacks) {
      const convertedCallback = async (supabaseUser: { id: string; email?: string; user_metadata?: { name?: string; handle?: string } } | null) => {
        if (supabaseUser) {
          try {
            // Convert Supabase user to our User format
            const authUser = await this.createProfileIfNotExists(
              supabaseUser.id, 
              supabaseUser.email || ''
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

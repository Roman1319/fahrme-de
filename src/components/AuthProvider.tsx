"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, onAuthStateChange, getAuthReady, getGlobalUser } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email: string;
  name?: string;
  handle?: string;
  user_metadata?: {
    name?: string;
    handle?: string;
    city?: string;
  };
}

interface AuthContext {
  user: User | null;
  refresh: () => void;
  login: (email: string, pwd: string) => Promise<string | null>;
  register: (name: string, email: string, pwd: string) => Promise<string | null>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  isGuest: () => boolean;
  isLoading: boolean;
  authReady: boolean;
}
const AuthCtx = createContext<AuthContext | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();

  // Initialize with global auth state
  useEffect(() => {
    logger.debug('[AuthProvider] Initializing...');
    setMounted(true);
    setIsLoading(true);
    setAuthReady(getAuthReady());
    
    const globalUser = getGlobalUser();
    logger.debug('[AuthProvider] Global user:', globalUser);
    if (globalUser) {
      const userData: User = {
        id: globalUser.id,
        email: globalUser.email || '',
        name: globalUser.user_metadata?.name,
        handle: globalUser.user_metadata?.handle
      };
      logger.debug('[AuthProvider] Setting user data:', userData);
      setUser(userData);
    }
    
    setIsLoading(false);
  }, []);
  
  const refresh = () => {
    // Refresh user data from Supabase
    supabase.auth.getUser().then(({ data: { user: currentUser }, error }) => {
      if (error) {
        logger.error('[auth] Error refreshing user:', error);
        return;
      }
      if (currentUser) {
        const userData: User = {
          id: currentUser.id,
          email: currentUser.email || '',
          name: currentUser.user_metadata?.name,
          handle: currentUser.user_metadata?.handle
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    });
  };
  
  // Subscribe to global auth state changes - единственный слушатель
  useEffect(() => {
    if (!mounted) return;
    
    logger.debug('[auth] Subscribing to global auth state changes...');
    const unsubscribe = onAuthStateChange((globalUser, ready) => {
      logger.debug('[auth] Global auth state changed:', globalUser?.email, 'ready:', ready);
      
      setAuthReady(ready);
      setIsLoading(!ready);
      
      if (globalUser) {
        const userData: User = {
          id: globalUser.id,
          email: globalUser.email || '',
          name: globalUser.user_metadata?.name,
          handle: globalUser.user_metadata?.handle
        };
        setUser(userData);
        console.info('[auth] User set:', userData.email);
      } else {
        setUser(null);
        console.info('[auth] User cleared');
      }
    });
    
    return () => {
      console.info('[auth] Unsubscribing from global auth state changes');
      unsubscribe();
    };
  }, [mounted]);

  return (
    <AuthCtx.Provider value={{
      user: mounted ? user : null,
      refresh,
      isAuthenticated: () => !!user,
      isGuest: () => !user,
      isLoading: isLoading,
      authReady: mounted ? authReady : false,
      login: async (email, password) => { 
        try {
          console.info('[auth] Attempting Supabase login for:', email);
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) {
            console.error('[auth] Login failed:', error.message);
            return error.message;
          }
          
          console.info('[auth] Login successful');
          // User will be set by onAuthStateChanged
          return null;
        } catch (error) {
          console.error('[auth] Login error:', error);
          return 'Login failed';
        }
      },
      register: async (name, email, password) => { 
        try {
          console.info('[auth] Attempting Supabase registration for:', email);
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                handle: email.split('@')[0]
              }
            }
          });
          
          if (error) {
            console.error('[auth] Registration failed:', error.message);
            return error.message;
          }
          
          console.info('[auth] Registration successful');
          // User will be set by onAuthStateChanged if session is created
          return null;
        } catch (error) {
          console.error('[auth] Registration error:', error);
          return 'Registration failed';
        }
      },
      logout: async () => { 
        try {
          console.info('[auth] Logging out from Supabase...');
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('[auth] Logout error:', error);
            return;
          }
          
          console.info('[auth] Logout successful');
          // User will be cleared by onAuthStateChanged
        } catch (error) {
          console.error('[auth] Logout error:', error);
          // Force clear
          setUser(null);
        }
      }
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

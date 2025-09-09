"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string;
  handle?: string;
};

type Ctx = {
  user: User | null;
  refresh: () => void;
  login: (email:string, pwd:string) => Promise<string | null>;
  register: (name:string, email:string, pwd:string) => Promise<string | null>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  isGuest: () => boolean;
  isLoading: boolean;
  authReady: boolean;
};
const AuthCtx = createContext<Ctx | null>(null);

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

  useEffect(() => { 
    setMounted(true); 
    setIsLoading(true);
    setAuthReady(false);
    console.info('[auth] Initializing Supabase auth provider...');
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[auth] Error getting session:', error);
        } else if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            handle: session.user.user_metadata?.handle
          };
          setUser(userData);
          console.info('[auth] User loaded from session:', userData.email, 'ID:', userData.id);
        }
        setAuthReady(true);
        console.info('[auth] AuthReady set to true');
      } catch (error) {
        console.error('[auth] Error initializing auth:', error);
        setAuthReady(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  const refresh = () => {
    // Refresh user data from Supabase
    supabase.auth.getUser().then(({ data: { user: currentUser }, error }) => {
      if (error) {
        console.error('[auth] Error refreshing user:', error);
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
  
  // Listen to Supabase auth state changes
  useEffect(() => {
    if (!mounted) return;
    
    console.info('[auth] Setting up Supabase auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.info('[auth] Supabase auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          handle: session.user.user_metadata?.handle
        };
        setUser(userData);
        console.info('[auth] User set:', userData.email);
      } else {
        setUser(null);
        console.info('[auth] User cleared');
      }
      
      setIsLoading(false);
      setAuthReady(true);
      console.info('[auth] AuthReady set to true (auth state changed)');
    });
    
    return () => {
      console.info('[auth] Cleaning up Supabase auth listener');
      subscription.unsubscribe();
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

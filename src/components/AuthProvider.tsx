"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getAuthService, type User } from "@/services/auth";
import { STORAGE_KEYS } from "@/lib/keys";
import { useRouter } from "next/navigation";

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
  const auth = useMemo(() => getAuthService(), []); // Memoize auth service to prevent recreation
  const router = useRouter();

  useEffect(() => { 
    setMounted(true); 
    setIsLoading(true);
    setAuthReady(false);
    console.info('[auth] Initializing auth provider...');
    
    // For Supabase, we need to check session asynchronously
    // For local auth, we check immediately
    const initializeAuth = async () => {
      try {
        const currentUser = auth.getCurrentUser();
        console.info('[auth] currentUser() result:', currentUser);
        
        if (currentUser) {
          setUser(currentUser);
          console.info('[auth] User loaded:', currentUser.email, 'ID:', currentUser.id);
          setAuthReady(true);
          console.info('[auth] AuthReady set to true (user found)');
        } else {
          // For Supabase, we need to check if there's already a session
          // This handles the case where the user is already signed in but we missed the initial event
          if (typeof window !== 'undefined' && window.authStateChangeCallbacks) {
            console.info('[auth] Checking for existing Supabase session...');
            // Try to get the current session from Supabase directly
            import('@/lib/supabaseClient').then(({ supabase }) => {
              supabase.auth.getSession().then(({ data: { session }, error }) => {
                if (error) {
                  console.error('[auth] Error getting session:', error);
                } else if (session?.user) {
                  console.info('[auth] Found existing Supabase session:', session.user.email);
                  // Manually trigger the auth state change immediately
                  if (window.authStateChangeCallbacks) {
                    window.authStateChangeCallbacks.forEach(callback => {
                      try {
                        callback(session.user);
                      } catch (error) {
                        console.error('[auth] Error in manual auth callback:', error);
                      }
                    });
                  }
                } else {
                  console.info('[auth] No existing Supabase session found');
                }
              });
            });
            
            // Set fallback timer
            setTimeout(() => {
              console.info('[auth] Fallback timer: marking auth as ready');
              setAuthReady(true);
              console.info('[auth] AuthReady set to true (fallback timer)');
            }, 300);
          } else {
            // For local auth, set fallback timer
            setTimeout(() => {
              console.info('[auth] Fallback timer: marking auth as ready');
              setAuthReady(true);
              console.info('[auth] AuthReady set to true (fallback timer)');
            }, 300);
          }
        }
      } catch (error) {
        console.error('[auth] Error initializing auth:', error);
        setAuthReady(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [auth]); // Removed authReady from dependencies to prevent infinite loop
  
  const refresh = useMemo(() => () => setUser(auth.getCurrentUser()), [auth]);
  
  // Listen to auth state changes (works for both local and Supabase)
  useEffect(() => {
    if (!mounted) return;
    
    console.info('[auth] Setting up auth state listener...');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.info('[auth] Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      setIsLoading(false);
      setAuthReady(true);
      console.info('[auth] AuthReady set to true (auth state changed)');
      
      // Don't redirect here - let Guard handle it
      // This prevents race conditions between AuthProvider and Guard
    });
    
    return () => {
      console.info('[auth] Cleaning up auth state listener');
      unsubscribe();
    };
  }, [mounted, auth, router]);
  
  // Слушаем изменения в localStorage для синхронизации между вкладками (только для local auth)
  useEffect(() => {
    if (!mounted) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SESSION_KEY) {
        console.info('[auth] Session changed in another tab');
        const newUser = auth.getCurrentUser();
        setUser(newUser);
        
        // Если сессия была очищена в другой вкладке, редиректим на главную
        if (!newUser && e.newValue === null) {
          console.info('[auth] Session cleared in another tab, redirecting to home');
          router.replace('/');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted, auth, router]);

  return (
    <AuthCtx.Provider value={{
      user: mounted ? user : null,
      refresh,
      isAuthenticated: () => !!user,
      isGuest: () => !user,
      isLoading: isLoading,
      authReady: mounted ? authReady : false,
      login: async (e,p)=>{ 
        try {
          console.info('[auth] Attempting login for:', e);
          const result = await auth.login({email: e, password: p}); 
          console.info('[auth] Login result:', result);
          if (result.success) {
            console.info('[auth] Login successful');
            // User will be set by onAuthStateChanged
            return null;
          }
          console.error('[auth] Login failed:', result.error);
          return result.error || 'Login failed';
        } catch (error) {
          console.error('[auth] Login error:', error);
          return 'Login failed';
        }
      },
      register: async (n,e,p)=>{ 
        try {
          console.info('[auth] Attempting registration for:', e);
          const result = await auth.register({name: n, email: e, password: p}); 
          if (result.success) {
            console.info('[auth] Registration successful');
            // User will be set by onAuthStateChanged if session is created
            return result.error || null; // Return error message if email confirmation required
          }
          console.error('[auth] Registration failed:', result.error);
          return result.error || 'Registration failed';
        } catch (error) {
          console.error('[auth] Registration error:', error);
          return 'Registration failed';
        }
      },
      logout: async ()=>{ 
        try {
          console.info('[auth] Logging out...');
          await auth.logout(); 
          // User will be cleared by onAuthStateChanged
          // Redirect will be handled by Guard component
        } catch (error) {
          console.error('[auth] Logout error:', error);
          // Force clear and redirect
          setUser(null);
          router.replace('/');
        }
      }
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

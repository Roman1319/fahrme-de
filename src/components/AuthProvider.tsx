"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/lib/auth";
import * as Auth from "@/lib/auth";

const SESSION_KEY = 'fahrme:session';

type Ctx = {
  user: User | null;
  refresh: () => void;
  login: (email:string, pwd:string) => string | null;
  register: (name:string, email:string, pwd:string) => string | null;
  logout: () => void;
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

  useEffect(() => { 
    setMounted(true); 
    console.info('[auth] Initializing auth provider...');
    
    // Проверяем аутентификацию при загрузке
    const currentUser = Auth.currentUser();
    console.info('[auth] currentUser() result:', currentUser);
    setUser(currentUser);
    
    if (currentUser) {
      console.info('[auth] User loaded:', currentUser.email, 'ID:', currentUser.id);
    } else {
      console.info('[auth] No user session found');
    }
  }, []);
  
  const refresh = () => setUser(Auth.currentUser());
  
  // Слушаем изменения в localStorage для синхронизации между вкладками
  useEffect(() => {
    if (!mounted) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        console.info('[auth] Session changed in another tab');
        const newUser = Auth.currentUser();
        setUser(newUser);
        
        // Если сессия была очищена в другой вкладке, редиректим на explore
        if (!newUser && e.newValue === null) {
          console.info('[auth] Session cleared in another tab, redirecting to explore');
          window.location.href = '/explore';
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  return (
    <AuthCtx.Provider value={{
      user: mounted ? user : null,
      refresh,
      login: (e,p)=>{ const err = Auth.login(e,p); setUser(Auth.currentUser()); return err; },
      register: (n,e,p)=>{ const err = Auth.register(n,e,p); setUser(Auth.currentUser()); return err; },
      logout: ()=>{ 
        try {
          console.info('[auth] Logging out...');
          Auth.logout(); 
          setUser(null); 
          
          // Синхронизация с другими вкладками
          localStorage.setItem(SESSION_KEY, '');
          localStorage.removeItem(SESSION_KEY);
          
          // Редирект на explore
          window.location.href = '/explore';
        } catch (error) {
          console.error('[auth] Logout error:', error);
          // Принудительно очищаем localStorage и редиректим
          localStorage.clear();
          window.location.href = '/explore';
        }
      }
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

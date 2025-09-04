"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/lib/auth";
import * as Auth from "@/lib/auth";

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
    setUser(Auth.currentUser()); 
  }, []);
  
  const refresh = () => setUser(Auth.currentUser());
  
  // Слушаем изменения в localStorage для синхронизации состояния
  useEffect(() => {
    if (!mounted) return;
    
    const handleStorageChange = () => {
      setUser(Auth.currentUser());
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
        Auth.logout(); 
        setUser(null); 
        // Немедленный редирект с принудительной перезагрузкой
        window.location.href = '/'; 
      }
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

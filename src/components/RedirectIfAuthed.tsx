"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import * as Auth from "@/lib/auth";

export default function RedirectIfAuthed() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const checkAuth = () => {
        try {
          // Проверяем через контекст (более надежно)
          if (user) {
            console.log('[RedirectIfAuthed] User found in context, redirecting to /feed');
            router.replace("/feed");
            return;
          }
          
          // Дополнительная проверка через функцию currentUser() из auth.ts
          const currentUser = Auth.currentUser();
          if (currentUser) {
            console.log('[RedirectIfAuthed] User found via currentUser(), redirecting to /feed');
            router.replace("/feed");
            return;
          }
          
          console.log('[RedirectIfAuthed] No user found, staying on explore page');
        } catch (error) {
          console.warn('[RedirectIfAuthed] Error checking authentication:', error);
        }
      };

      // Проверяем через небольшую задержку, чтобы дать время AuthProvider загрузиться
      const timer = setTimeout(checkAuth, 300);
      
      return () => clearTimeout(timer);
    }
  }, [user, router, mounted]);

  // Показываем индикатор загрузки во время проверки
  if (!mounted) {
    return null;
  }

  return null;
}

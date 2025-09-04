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
          // Проверяем через функцию currentUser() из auth.ts
          const currentUser = Auth.currentUser();
          
          // Если пользователь авторизован (есть в localStorage), перенаправляем на /feed
          if (currentUser) {
            console.log('User is authenticated, redirecting to /feed');
            router.replace("/feed");
            return;
          }
          
          // Дополнительная проверка через контекст
          if (user) {
            console.log('User found in context, redirecting to /feed');
            router.replace("/feed");
            return;
          }
        } catch (error) {
          console.warn('Error checking authentication:', error);
        }
      };

      // Проверяем сразу и через небольшую задержку для надежности
      checkAuth();
      const timer = setTimeout(checkAuth, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, router, mounted]);

  // Показываем индикатор загрузки во время проверки
  if (!mounted) {
    return null;
  }

  return null;
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RedirectIfAuthed() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Проверяем не только user из контекста, но и localStorage
      const checkAuth = () => {
        try {
          const storedUser = localStorage.getItem('fahrme:user');
          const storedProfile = localStorage.getItem('fahrme:profile');
          const isStoredAuth = Boolean(storedUser || storedProfile);
          
          // Перенаправляем только если пользователь авторизован И в контексте, И в localStorage
          if (user && isStoredAuth) {
            router.replace("/feed");
          }
        } catch (error) {
          // Если ошибка при чтении localStorage, не перенаправляем
          console.warn('Error checking localStorage:', error);
        }
      };

      // Проверяем сразу и через небольшую задержку
      checkAuth();
      const timer = setTimeout(checkAuth, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user, router, mounted]);

  return null;
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import * as Auth from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const checkAuth = () => {
        try {
          // Проверяем через функцию currentUser() из auth.ts
          const currentUser = Auth.currentUser();
          
          // Если пользователь НЕ авторизован, перенаправляем на главную
          if (!currentUser && !user) {
            console.log('User not authenticated, redirecting to home');
            router.replace("/");
            return;
          }
          
          // Если пользователь авторизован, показываем контент
          setIsLoading(false);
        } catch (error) {
          console.warn('Error checking authentication:', error);
          // В случае ошибки тоже перенаправляем на главную
          router.replace("/");
        }
      };

      // Проверяем сразу и через небольшую задержку
      checkAuth();
      const timer = setTimeout(checkAuth, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, router, mounted]);

  // Показываем загрузку во время проверки
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Lade...</p>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован, показываем контент
  return <>{children}</>;
}

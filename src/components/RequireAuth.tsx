"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, authReady } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && authReady) {
      // Если пользователь НЕ авторизован, перенаправляем на главную
      if (!user) {
        console.log('User not authenticated, redirecting to home');
        router.replace("/");
        return;
      }
    }
  }, [user, router, mounted, authReady]);

  // Показываем загрузку во время проверки
  if (!mounted || authLoading || !authReady) {
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

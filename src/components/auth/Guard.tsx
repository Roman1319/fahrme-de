"use client";
import { useEffect } from 'react';
import { useAuth } from '../AuthProvider';

interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Guard({ children, fallback }: GuardProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) {
      console.info('[auth] No session found, redirecting to explore');
      window.location.href = '/explore';
    }
  }, [user]);

  // Если пользователь не авторизован, показываем fallback или ничего
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Redirecting...</div>
          <div className="text-sm opacity-70">Please wait while we redirect you to the explore page.</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

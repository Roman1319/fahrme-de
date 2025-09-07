"use client";
import { useEffect } from 'react';
import { useAuth } from '../AuthProvider';

interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Guard({ children, fallback }: GuardProps) {
  const { user, isLoading } = useAuth();

  // Debug: log guard state
  console.log('[guard] User:', user ? `${user.email} (${user.id})` : 'null');
  console.log('[guard] Loading:', isLoading);
  console.log('[guard] Will redirect:', !isLoading && !user);
  console.log('[guard] Component render - user exists:', !!user, 'isLoading:', isLoading);

  useEffect(() => {
    // Only redirect if we're sure there's no user (not loading)
    if (!isLoading && !user) {
      console.info('[guard] No session found, redirecting to explore');
      // Add a small delay to allow AuthProvider to update
      const timeoutId = setTimeout(() => {
        window.location.href = '/explore';
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading...</div>
          <div className="text-sm opacity-70">Please wait while we check your authentication.</div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show fallback
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

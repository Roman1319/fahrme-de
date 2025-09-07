"use client";
import { useEffect } from 'react';
import { useAuth } from '../AuthProvider';

interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Guard({ children, fallback }: GuardProps) {
  const { user, isLoading, authReady } = useAuth();

  // Debug: log guard state
  console.log('[guard] User:', user ? `${user.email} (${user.id})` : 'null');
  console.log('[guard] Loading:', isLoading);
  console.log('[guard] AuthReady:', authReady);
  console.log('[guard] Will redirect:', authReady && !user);
  console.log('[guard] Component render - user exists:', !!user, 'isLoading:', isLoading, 'authReady:', authReady);

  useEffect(() => {
    // Only redirect if auth is ready and there's no user
    if (authReady && !user) {
      console.info('[guard] No session found, redirecting to home');
      console.info('[guard] Redirect decision: authReady=true, user=null');
      // Use client-side navigation instead of window.location.href
      const timeoutId = setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, authReady]);

  // Show loading state while checking auth
  if (!authReady || isLoading) {
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
          <div className="text-sm opacity-70">Please wait while we redirect you to the home page.</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

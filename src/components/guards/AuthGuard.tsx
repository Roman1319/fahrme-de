'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import AuthModal from '@/components/ui/AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  showModal?: boolean;
}

export default function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/',
  requireAuth = true,
  showModal = true
}: AuthGuardProps) {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && isGuest) {
      if (showModal) {
        setShowAuthModal(true);
      } else {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isGuest, isLoading, requireAuth, showModal, redirectTo, router]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Если требуется авторизация и пользователь гость
  if (requireAuth && isGuest) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showModal) {
      return (
        <>
          {children}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        </>
      );
    }

    return null;
  }

  // Если не требуется авторизация или пользователь авторизован
  return <>{children}</>;
}

// Хук для проверки авторизации в компонентах
export function useRequireAuth() {
  const { isAuthenticated, isGuest } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = (callback?: () => void) => {
    if (isGuest) {
      setShowAuthModal(true);
      return false;
    }
    
    callback?.();
    return true;
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  return {
    isAuthenticated,
    isGuest,
    requireAuth,
    showAuthModal,
    setShowAuthModal,
    handleAuthSuccess
  };
}

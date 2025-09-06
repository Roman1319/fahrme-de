'use client';

import { ReactNode } from 'react';
import { useRequireAuth } from '@/components/guards/AuthGuard';
import AuthModal from './AuthModal';

interface ProtectedActionProps {
  children: ReactNode;
  action?: () => void;
  fallback?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function ProtectedAction({ 
  children, 
  action, 
  fallback,
  className = '',
  disabled = false
}: ProtectedActionProps) {
  const { requireAuth, showAuthModal, setShowAuthModal, handleAuthSuccess } = useRequireAuth();

  const handleClick = () => {
    if (disabled) return;
    
    requireAuth(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
      >
        {children}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

// Хук для использования в компонентах
export function useProtectedAction() {
  const { requireAuth, showAuthModal, setShowAuthModal, handleAuthSuccess } = useRequireAuth();

  const executeProtectedAction = (action: () => void) => {
    return requireAuth(action);
  };

  return {
    executeProtectedAction,
    showAuthModal,
    setShowAuthModal,
    handleAuthSuccess
  };
}

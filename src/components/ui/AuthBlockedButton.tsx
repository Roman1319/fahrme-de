'use client';

import { Button } from './button';
import { getAuthReady } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthBlockedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  [key: string]: any;
}

export function AuthBlockedButton({ 
  children, 
  onClick, 
  disabled = false, 
  ...props 
}: AuthBlockedButtonProps) {
  const [authReady, setAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем готовность аутентификации
    const checkAuth = () => {
      const ready = getAuthReady();
      setAuthReady(ready);
      setIsLoading(!ready);
    };

    checkAuth();

    // Подписываемся на изменения
    const { onAuthStateChange } = require('@/lib/supabaseClient');
    const unsubscribe = onAuthStateChange((_, ready) => {
      setAuthReady(ready);
      setIsLoading(!ready);
    });

    return unsubscribe;
  }, []);

  const isDisabled = disabled || !authReady || isLoading;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={authReady ? onClick : undefined}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Загрузка...
        </>
      ) : (
        children
      )}
    </Button>
  );
}

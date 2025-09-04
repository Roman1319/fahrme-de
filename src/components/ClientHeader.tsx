'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from './AuthProvider';

export default function ClientHeader() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Определяем вариант Header в зависимости от страницы
  const getHeaderVariant = () => {
    if (pathname === '/feed') return 'feed';
    return 'default';
  };

  // Показываем Header всегда, но аватар только для залогиненных
  return <Header variant={getHeaderVariant()} />;
}

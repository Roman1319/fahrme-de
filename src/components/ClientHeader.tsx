'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from './AuthProvider';

export default function ClientHeader() {
  const { user: _user } = useAuth();
  const [_mounted, setMounted] = useState(false);
  const _pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Показываем Header всегда с поиском
  return <Header variant="feed" />;
}
